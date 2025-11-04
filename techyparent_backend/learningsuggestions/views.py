from django.shortcuts import render, get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import LearningVideo, ChildLearningProgress
from .serializers import LearningVideoSerializer, ChildLearningProgressSerializer
from api.models import Child

# Get learning suggestions by child age, with optional category or search
@api_view(["GET"])
def learning_suggestions_for_child(request, child_id):
    child = get_object_or_404(Child, id=child_id)
    category = request.GET.get("category")
    search = request.GET.get("search")

    videos = LearningVideo.objects.filter(age_min__lte=child.age, age_max__gte=child.age)

    if category:
        videos = videos.filter(category__iexact=category)

    if search:
        videos = videos.filter(title__icontains=search)

    videos = videos.order_by("title")
    serializer = LearningVideoSerializer(videos, many=True)
    return Response(serializer.data)

# 2️⃣ List all videos or create new (admin use)
class LearningVideoListCreateView(generics.ListCreateAPIView):
    queryset = LearningVideo.objects.all()
    serializer_class = LearningVideoSerializer


# 3️⃣ Track progress (watched / liked)
class ChildLearningProgressView(generics.ListCreateAPIView):
    queryset = ChildLearningProgress.objects.all()
    serializer_class = ChildLearningProgressSerializer
