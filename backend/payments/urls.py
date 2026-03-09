from django.urls import path
from . import views

urlpatterns = [
    path("payments/pay-rent/", views.PayRentView.as_view(), name="pay-rent"),
    path("payments/history/", views.PaymentHistoryView.as_view(), name="payment-history"),
    path("payments/", views.PaymentListView.as_view(), name="payment-list"),
]
