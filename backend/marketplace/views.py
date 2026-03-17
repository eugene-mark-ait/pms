from decimal import Decimal
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Q

from accounts.permissions import IsServiceProvider
from .models import Service, ServiceReview, ServiceRequest
from .serializers import (
    ServiceSerializer,
    ServiceCreateUpdateSerializer,
    ServiceReviewSerializer,
    ServiceRequestSerializer,
)


class ServiceListCreateView(APIView):
    """
    GET /marketplace/services/?provider_id=&category=&min_price=&max_price=&min_rating=
    POST /marketplace/services/ - create service. IsServiceProvider only.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsServiceProvider()]
        return [AllowAny()]

    def get(self, request):
        qs = Service.objects.all().select_related("provider")
        provider_id = request.query_params.get("provider_id")
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
                qs = qs.annotate(avg_rating=Avg("reviews__rating")).filter(avg_rating__gte=r)
            except Exception:
                pass
        qs = qs.order_by("-created_at")
        serializer = ServiceSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = ServiceCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = Service.objects.create(provider=request.user, **serializer.validated_data)
        return Response(ServiceSerializer(service).data, status=status.HTTP_201_CREATED)


class MyServicesView(APIView):
    """
    GET /marketplace/my-services/ - list current user's services. IsServiceProvider only.
    """

    permission_classes = [IsAuthenticated, IsServiceProvider]

    def get(self, request):
        qs = Service.objects.filter(provider=request.user).order_by("-created_at")
        serializer = ServiceSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})


class ServiceDetailView(APIView):
    """
    GET /marketplace/services/<id>/ - retrieve (AllowAny).
    PUT /marketplace/services/<id>/ - update (owner only).
    DELETE /marketplace/services/<id>/ - delete (owner only).
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsServiceProvider()]

    def get_object(self, pk):
        return get_object_or_404(Service, pk=pk)

    def get(self, request, pk):
        service = self.get_object(pk)
        return Response(ServiceSerializer(service).data)

    def put(self, request, pk):
        service = self.get_object(pk)
        if service.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceCreateUpdateSerializer(service, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ServiceSerializer(service).data)

    def delete(self, request, pk):
        service = self.get_object(pk)
        if service.provider_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarketplaceInsightsView(APIView):
    """
    GET /marketplace/insights/ - stub insights for dashboard. AllowAny or IsAuthenticated.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        total_services = Service.objects.count()
        return Response({
            "total_services": total_services,
            "active_providers": Service.objects.values("provider").distinct().count(),
        })


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
        serializer = ServiceReviewSerializer(data={
            **request.data,
            "provider_id": service.provider_id,
            "service_id": service.id,
            "user_id": request.user.id,
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, provider=service.provider, service=service)
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


class MyRequestsView(APIView):
    """GET /marketplace/my-requests/ - list requests received by current provider."""
    permission_classes = [IsAuthenticated, IsServiceProvider]

    def get(self, request):
        qs = ServiceRequest.objects.filter(provider=request.user).select_related("user", "service").order_by("-created_at")
        return Response(ServiceRequestSerializer(qs, many=True).data)


class ServiceRequestDetailView(APIView):
    """PATCH /marketplace/requests/<pk>/ - update status (e.g. mark actioned). Provider only."""
    permission_classes = [IsAuthenticated, IsServiceProvider]

    def patch(self, request, pk):
        req = get_object_or_404(ServiceRequest, pk=pk, provider=request.user)
        status_val = (request.data.get("status") or "").strip().lower()
        if status_val == ServiceRequest.Status.ACTIONED:
            req.status = ServiceRequest.Status.ACTIONED
            req.save(update_fields=["status"])
        return Response(ServiceRequestSerializer(req).data)
