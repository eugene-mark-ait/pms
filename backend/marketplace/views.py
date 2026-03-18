"""
Marketplace API: services, reviews, requests.
- Cursor-based pagination for services list and user's sent requests.
- Filters: status, service type for requests; category, price, min_rating, sort for services.
- Image upload for service with validation (type, size).
"""
from decimal import Decimal
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsServiceProvider
from .models import Service, ServiceReview, ServiceRequest
from .pagination import CursorPagination
from .serializers import (
    ServiceSerializer,
    ServiceCreateUpdateSerializer,
    ServiceReviewSerializer,
    ServiceRequestSerializer,
)

# Image upload: max 5MB, allowed content types
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _services_queryset_with_ratings():
    """Annotate services with avg_rating and review_count for filtering/sorting."""
    return Service.objects.all().select_related("provider").annotate(
        avg_rating=Avg("reviews__rating"),
        review_count_val=Count("reviews"),
    )


class ServiceListCreateView(APIView):
    """
    GET /marketplace/services/
    - Cursor-based pagination: cursor=, page_size=
    - Filters: provider_id, category, min_price, max_price, min_rating
    - Sort: sort=newest|rating_desc|rating_asc|reviews_desc (default newest)
    POST - create service (IsServiceProvider).
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsServiceProvider()]
        return [AllowAny()]

    def get(self, request):
        qs = _services_queryset_with_ratings()
        provider_id = request.query_params.get("provider_id") or request.query_params.get("provider")
        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        category = (request.query_params.get("category") or "").strip()
        if category:
            qs = qs.filter(category=category)
        min_price = request.query_params.get("min_price", "").strip()
        if min_price:
            try:
                qs = qs.filter(max_price__gte=Decimal(min_price))
            except Exception:
                pass
        max_price = request.query_params.get("max_price", "").strip()
        if max_price:
            try:
                qs = qs.filter(min_price__lte=Decimal(max_price))
            except Exception:
                pass
        min_rating = request.query_params.get("min_rating", "").strip()
        if min_rating:
            try:
                r = float(min_rating)
                qs = qs.filter(avg_rating__gte=r)
            except Exception:
                pass
        sort = (request.query_params.get("sort") or "newest").strip().lower()
        if sort == "rating_desc":
            qs = qs.order_by("-avg_rating", "-created_at", "-id")
        elif sort == "rating_asc":
            qs = qs.order_by("avg_rating", "-created_at", "-id")
        elif sort == "reviews_desc":
            qs = qs.order_by("-review_count_val", "-created_at", "-id")
        else:
            qs = qs.order_by("-created_at", "-id")
        page_size = min(int(request.query_params.get("page_size", 20) or 20), 100)
        use_cursor = sort == "newest"
        if use_cursor:
            paginator = CursorPagination()
            page = paginator.paginate_queryset(qs, request)
            if page is not None:
                serializer = ServiceSerializer(page, many=True, context={"request": request})
                return paginator.get_paginated_response(serializer.data)
        # Offset path for sort by rating/reviews: page=1,2,...
        page_num = max(1, int(request.query_params.get("page", 1) or 1))
        start = (page_num - 1) * page_size
        slice_qs = qs[start : start + page_size + 1]
        has_next = len(slice_qs) > page_size
        results_qs = slice_qs[:page_size]
        serializer = ServiceSerializer(results_qs, many=True, context={"request": request})
        next_val = str(page_num + 1) if has_next else None
        return Response({"results": serializer.data, "next": next_val, "count": None})

    def post(self, request):
        serializer = ServiceCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = Service.objects.create(provider=request.user, **serializer.validated_data)
        return Response(ServiceSerializer(service, context={"request": request}).data, status=status.HTTP_201_CREATED)


class MyServicesView(APIView):
    """GET /marketplace/my-services/ - list current user's services. IsServiceProvider only."""
    permission_classes = [IsAuthenticated, IsServiceProvider]

    def get(self, request):
        qs = Service.objects.filter(provider=request.user).order_by("-created_at")
        serializer = ServiceSerializer(qs, many=True, context={"request": request})
        return Response({"results": serializer.data, "count": qs.count()})


class ServiceDetailView(APIView):
    """
    GET /marketplace/services/<id>/ - retrieve (AllowAny).
    PUT - update (owner only).
    DELETE - delete (owner only).
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsServiceProvider()]

    def get_object(self, pk):
        return get_object_or_404(Service, pk=pk)

    def get(self, request, pk):
        service = self.get_object(pk)
        return Response(ServiceSerializer(service, context={"request": request}).data)

    def put(self, request, pk):
        service = self.get_object(pk)
        if service.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceCreateUpdateSerializer(service, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ServiceSerializer(service, context={"request": request}).data)

    def delete(self, request, pk):
        service = self.get_object(pk)
        if service.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceImageUploadView(APIView):
    """
    POST /marketplace/services/<pk>/upload-image/
    - Accept multipart file; validate type (jpeg, png, webp, gif) and size (max 5MB).
    - Store in MEDIA_ROOT/marketplace/services/; save image URL on service.
    """
    permission_classes = [IsAuthenticated, IsServiceProvider]

    def post(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        if service.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        file = request.FILES.get("image")
        if not file:
            return Response({"detail": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > MAX_IMAGE_SIZE_BYTES:
            return Response(
                {"detail": f"Image must be under {MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        content_type = getattr(file, "content_type", "") or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {"detail": "Allowed types: JPEG, PNG, WebP, GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        service.image = file
        service.save(update_fields=["image"])
        return Response(ServiceSerializer(service, context={"request": request}).data)


class MarketplaceInsightsView(APIView):
    """GET /marketplace/insights/ - stub insights. AllowAny."""
    permission_classes = [AllowAny]

    def get(self, request):
        total_services = Service.objects.count()
        return Response({
            "total_services": total_services,
            "active_providers": Service.objects.values("provider").distinct().count(),
        })


class MarketplaceProvidersListView(APIView):
    """GET /marketplace/providers/ - list providers who have at least one service (for filter dropdown)."""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        provider_ids = Service.objects.values_list("provider_id", flat=True).distinct()
        users = User.objects.filter(id__in=provider_ids).order_by("first_name", "last_name", "email")
        out = []
        for u in users:
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email
            out.append({"id": str(u.id), "email": u.email, "name": name})
        return Response(out)


class ServiceReviewListCreateView(APIView):
    """GET/POST /marketplace/services/<pk>/reviews/ - list reviews, create review (auth)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        qs = ServiceReview.objects.filter(service=service).select_related("user").order_by("-created_at")
        return Response(ServiceReviewSerializer(qs, many=True).data)

    def post(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        request_id = (request.data.get("request_id") or "").strip() or None
        req = None
        if request_id:
            req = get_object_or_404(ServiceRequest, pk=request_id)
            if req.service_id != service.id or req.user_id != request.user.id:
                return Response({"detail": "Request does not match this service or user."}, status=status.HTTP_400_BAD_REQUEST)
            if req.status != ServiceRequest.Status.ACTIONED:
                return Response({"detail": "Only actioned requests can be rated."}, status=status.HTTP_400_BAD_REQUEST)
            if req.is_rated:
                return Response({"detail": "Service already rated for this request."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ServiceReviewSerializer(data={
            **request.data,
            "provider_id": service.provider_id,
            "service_id": service.id,
            "user_id": request.user.id,
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, provider=service.provider, service=service)
        if req is not None:
            req.is_rated = True
            req.save(update_fields=["is_rated"])
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ServiceRequestCreateView(APIView):
    """POST /marketplace/services/<pk>/request/ - request a service (authenticated user)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        serializer = ServiceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, provider=service.provider, service=service)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MySentRequestsView(APIView):
    """
    GET /marketplace/my-sent-requests/
    - Requests made by the current user (as requester).
    - Cursor-based pagination: cursor=, page_size=
    - Filters: status=pending|actioned|cancelled, service_id=, category= (service's category)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ServiceRequest.objects.filter(user=request.user).select_related("service", "provider")
        status_filter = (request.query_params.get("status") or "").strip().lower()
        if status_filter in ("pending", "actioned", "cancelled"):
            qs = qs.filter(status=status_filter)
        service_id = request.query_params.get("service_id", "").strip()
        if service_id:
            qs = qs.filter(service_id=service_id)
        category = (request.query_params.get("category") or "").strip()
        if category:
            qs = qs.filter(service__category=category)
        qs = qs.order_by("-created_at", "-id")
        paginator = CursorPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is None:
            page = qs[: paginator.get_page_size(paginator.request)]
        serializer = ServiceRequestSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class MySentRequestsSummaryView(APIView):
    """
    GET /marketplace/my-sent-requests/summary/
    - Total count and count per service (for dashboard grouping).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ServiceRequest.objects.filter(user=request.user)
        total = qs.count()
        from django.db.models import Count
        per_service = list(
            qs.values("service_id", "service__title", "service__category")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response({"total": total, "by_service": per_service})


class MyRequestsView(APIView):
    """
    GET /marketplace/my-requests/ - list requests received by current provider (cursor paginated).
    Default: only pending (incoming). Use ?status=all for full history (e.g. Recent Requests).
    """
    permission_classes = [IsAuthenticated, IsServiceProvider]

    def get(self, request):
        qs = ServiceRequest.objects.filter(provider=request.user).select_related("user", "service").order_by("-created_at", "-id")
        if (request.query_params.get("status") or "").strip().lower() != "all":
            qs = qs.filter(status=ServiceRequest.Status.PENDING)
        paginator = CursorPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is None:
            page = qs[: paginator.get_page_size(paginator.request)]
        return paginator.get_paginated_response(ServiceRequestSerializer(page, many=True).data)


class MyRequestsCountsView(APIView):
    """GET /marketplace/my-requests/counts/ - pending/actioned counts for provider (rating flow, badges)."""
    permission_classes = [IsAuthenticated, IsServiceProvider]

    def get(self, request):
        qs = ServiceRequest.objects.filter(provider=request.user)
        pending = qs.filter(status=ServiceRequest.Status.PENDING).count()
        actioned = qs.filter(status=ServiceRequest.Status.ACTIONED).count()
        return Response({"pending": pending, "actioned": actioned})


class MySentRequestsCountView(APIView):
    """GET /marketplace/my-sent-requests/count/ - total/pending/actioned/awaiting_rating for user (dashboard card, badge)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ServiceRequest.objects.filter(user=request.user)
        total = qs.count()
        pending = qs.filter(status=ServiceRequest.Status.PENDING).count()
        actioned = qs.filter(status=ServiceRequest.Status.ACTIONED).count()
        awaiting_rating = qs.filter(status=ServiceRequest.Status.ACTIONED, is_rated=False).count()
        return Response({"total": total, "pending": pending, "actioned": actioned, "awaiting_rating": awaiting_rating})


class ServiceRequestDetailView(APIView):
    """
    GET /marketplace/requests/<pk>/ - retrieve (requester or provider).
    PATCH - update status (provider: mark actioned).
    DELETE - cancel request (requester only, pending only).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        req = get_object_or_404(ServiceRequest, pk=pk)
        if req.user_id != request.user.id and req.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ServiceRequestSerializer(req).data)

    def patch(self, request, pk):
        req = get_object_or_404(ServiceRequest, pk=pk)
        if req.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        status_val = (request.data.get("status") or "").strip().lower()
        if status_val == ServiceRequest.Status.ACTIONED:
            req.status = ServiceRequest.Status.ACTIONED
            req.save(update_fields=["status"])
        return Response(ServiceRequestSerializer(req).data)

    def delete(self, request, pk):
        req = get_object_or_404(ServiceRequest, pk=pk)
        if req.user_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if req.status != ServiceRequest.Status.PENDING:
            return Response({"detail": "Only pending requests can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        req.status = ServiceRequest.Status.CANCELLED
        req.save(update_fields=["status"])
        return Response(ServiceRequestSerializer(req).data)
