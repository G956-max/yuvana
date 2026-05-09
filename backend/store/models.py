from django.db import models

# Note: Cloudinary integration is active for all ImageFields.
# No model changes are required as django-cloudinary-storage handles these fields automatically.

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    name_ta = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    
    def __str__(self):
        return self.name

class Product(models.Model):
    nameKey = models.CharField(max_length=200)
    name_ta = models.CharField(max_length=200, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    description_ta = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    images = models.JSONField(default=list, blank=True) # Array of Image URLs (if any extra)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    reviews = models.IntegerField(default=0)
    variants = models.JSONField(default=list, blank=True)
    details = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nameKey
class Banner(models.Model):
    image = models.ImageField(upload_to='banners/')
    title = models.CharField(max_length=200, blank=True)
    title_ta = models.CharField(max_length=200, blank=True, null=True)
    subtitle = models.CharField(max_length=500, blank=True)
    subtitle_ta = models.CharField(max_length=500, blank=True, null=True)
    link = models.CharField(max_length=200, default='products', blank=True) # Page to navigate to
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title or f"Banner {self.id}"
