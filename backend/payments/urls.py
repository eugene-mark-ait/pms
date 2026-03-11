from django.urls import path
from . import views

urlpatterns = [
    path("payments/pay-rent/", views.PayRentView.as_view(), name="pay-rent"),
    path("payments/mpesa-stk-push/", views.MpesaStkPushView.as_view(), name="mpesa-stk-push"),
    path("payments/history/", views.PaymentHistoryView.as_view(), name="payment-history"),
    path("payments/export/", views.PaymentExportView.as_view(), name="payment-export"),
    path("payments/", views.PaymentListView.as_view(), name="payment-list"),
]
