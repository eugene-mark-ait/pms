from rest_framework import permissions


class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("landlord")


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("manager")


class IsTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("tenant")


class IsCaretaker(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role("caretaker")


class IsLandlordOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.has_role("landlord") or request.user.has_role("manager")


class IsTenantOrManagerOrLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (
            request.user.has_role("tenant")
            or request.user.has_role("manager")
            or request.user.has_role("landlord")
        )
