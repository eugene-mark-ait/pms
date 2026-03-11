"""Custom pagination: allow client to set page_size via query param."""
from rest_framework.pagination import PageNumberPagination


class OptionalPageSizePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 500
