"""
Cursor-based pagination for marketplace APIs.
Uses (created_at, id) as cursor for deterministic ordering; efficient with index on (created_at, id).
"""
import base64
import json
from rest_framework.pagination import BasePagination
from rest_framework.response import Response


class CursorPagination(BasePagination):
    """
    Cursor pagination: client sends cursor from previous response to get next page.
    Cursor is base64-encoded {created_at, id} so ordering is stable and efficient.
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    cursor_query_param = "cursor"

    def _decode_cursor(self, cursor_str):
        if not cursor_str:
            return None
        try:
            raw = base64.b64decode(cursor_str.encode("utf-8")).decode("utf-8")
            return json.loads(raw)
        except Exception:
            return None

    def _encode_cursor(self, created_at, id_val):
        payload = {"created_at": created_at, "id": str(id_val)}
        return base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    def paginate_queryset(self, queryset, request, view=None):
        self.request = request
        page_size = self.get_page_size(request)
        cursor_str = request.query_params.get(self.cursor_query_param)
        cursor = self._decode_cursor(cursor_str)

        # Order by (created_at, id) descending for deterministic cursor
        qs = queryset.order_by("-created_at", "-id")

        if cursor:
            from django.db.models import Q
            # Next page: rows where (created_at, id) < (cursor_created_at, cursor_id)
            qs = qs.filter(
                Q(created_at__lt=cursor["created_at"])
                | (Q(created_at=cursor["created_at"]) & Q(id__lt=cursor["id"]))
        self.queryset = qs
        self.page = list(qs[: page_size + 1])
        self.has_next = len(self.page) > page_size
        if self.has_next:
            self.page = self.page[:page_size]
        return self.page

    def get_paginated_response(self, data):
        next_cursor = None
        if self.has_next and self.page:
            last = self.page[-1]
            next_cursor = self._encode_cursor(
                last.created_at.isoformat() if hasattr(last.created_at, "isoformat") else str(last.created_at),
                last.id,
            )
        # Avoid expensive count() on large tables; client can use next to detect end
        return Response({
            "results": data,
            "next": next_cursor,
            "count": None,
        })

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "results": schema,
                "next": {"type": "string", "nullable": True},
                "count": {"type": "integer", "nullable": True},
            },
        }
