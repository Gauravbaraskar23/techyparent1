from rest_framework import generics
from .models import Goal
from .serializers import GoalSerializer

class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        queryset = Goal.objects.all()
        child_id = self.request.query_params.get('child_id', None)
        if child_id:
            queryset = queryset.filter(child_id=child_id)
        return queryset
