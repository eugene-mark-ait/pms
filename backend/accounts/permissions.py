from rest_framework import permissions


class IsPropertyOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("property_owner")


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("manager")


class IsTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("tenant")


class IsCaretaker(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("caretaker")


class IsServiceProvider(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("service_provider")


class IsPropertyOwnerOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.has_role("property_owner") or request.user.has_role("manager")


class IsPropertyOwnerOrManagerOrCaretaker(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (
            request.user.has_role("property_owner")
            or request.user.has_role("manager")
            or request.user.has_role("caretaker")
        )


class IsTenantOrManagerOrPropertyOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (
            request.user.has_role("tenant")
            or request.user.has_role("manager")
            or request.user.has_role("property_owner")
        )
