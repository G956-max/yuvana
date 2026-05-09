from rest_framework import viewsets, permissions
from .models import Product, Category, Banner
from .serializers import ProductSerializer, CategorySerializer, BannerSerializer

class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by('order')
    serializer_class = BannerSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Require authentication for modification
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Allow anyone to view products
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save()
