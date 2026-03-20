from django.urls import path
from . import views

urlpatterns = [
    path("pay-rent/", views.PayRentStkInitiateView.as_view(), name="pay-rent-api"),
    path("payments/pay-rent/", views.PayRentStkInitiateView.as_view(), name="pay-rent"),
    path("mpesa/callback/", views.MpesaCallbackView.as_view(), name="mpesa-callback"),
    path(
        "payments/mpesa-stk/<uuid:pk>/",
        views.MpesaStkStatusView.as_view(),
        name="mpesa-stk-status",
    ),
    path("payments/history/", views.PaymentHistoryView.as_view(), name="payment-history"),
    path("payments/export/", views.PaymentExportView.as_view(), name="payment-export"),
    path("payments/", views.PaymentListView.as_view(), name="payment-list"),
]
