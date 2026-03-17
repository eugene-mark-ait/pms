from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from accounts.permissions import IsServiceProvider
from .models import Service
from .serializers import ServiceSerializer, ServiceCreateUpdateSerializer


class ServiceListCreateView(APIView):
    """
    GET /marketplace/services/?provider_id=<uuid> - list services (all or by provider). AllowAny for GET.
    POST /marketplace/services/ - create service. IsServiceProvider only.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsServiceProvider()]
        return [AllowAny()]

    def get(self, request):
        provider_id = request.query_params.get("provider_id")
        if provider_id:
            qs = Service.objects.filter(provider_id=provider_id)
        else:
            qs = Service.objects.all()
        qs = qs.select_related("provider").order_by("-created_at")
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
