from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth.models import User
from .models import Parent, Child, Activity
from .serializers import (
    ParentSerializer, ChildSerializer, ChildSimpleSerializer,
    ActivitySerializer, RegisterSerializer
)

# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def api_home(request):
    """API welcome endpoint"""
    return Response({
        "message": "Welcome to TechyParent API!",
        "version": "1.0.0",
        "modules": [
            "Screen Time Management",
            "Goals & Achievements",
            "Learning Suggestions & AI Chatbot",
            "Daily Routine & Voice Assistant",
            "Family Bonding"
        ]
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register new user and create parent profile"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User registered successfully!',
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ============================================================================
# AUTHENTICATED ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user with parent profile"""
    try:
        parent = Parent.objects.get(user=request.user)
        serializer = ParentSerializer(parent)
        return Response(serializer.data)
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    """Get dashboard data for authenticated parent"""
    try:
        parent = Parent.objects.get(user=request.user)
        
        # Get all children
        children = parent.children.all()
        
        # Get summary statistics
        total_children = children.count()
        online_children = children.filter(online=True).count()
        
        # Get recent activities
        recent_activities = Activity.objects.filter(
            child__parent=parent
        ).order_by('-date')[:10]
        
        return Response({
            'parent': ParentSerializer(parent).data,
            'children': ChildSimpleSerializer(children, many=True).data,
            'statistics': {
                'total_children': total_children,
                'online_children': online_children,
            },
            'recent_activities': ActivitySerializer(recent_activities, many=True).data
        })
        
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)

# ============================================================================
# CHILD MANAGEMENT
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_children(request):
    """List all children for authenticated parent"""
    try:
        parent = Parent.objects.get(user=request.user)
        children = parent.children.all()
        serializer = ChildSerializer(children, many=True)
        return Response({
            'children': serializer.data,
            'count': children.count()
        })
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_child(request):
    """Add a new child to authenticated parent"""
    try:
        parent = Parent.objects.get(user=request.user)
        
        # Validate required fields
        name = request.data.get('name')
        age = request.data.get('age')
        
        if not name or not age:
            return Response({
                'error': 'Name and age are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create child
        child_data = {
            'parent': parent.id,
            'name': name,
            'age': int(age),
            'gender': request.data.get('gender', ''),
            'date_of_birth': request.data.get('date_of_birth'),
            'avatar': request.data.get('avatar', '')
        }
        
        serializer = ChildSerializer(data=child_data)
        
        if serializer.is_valid():
            child = serializer.save()
            return Response({
                'message': 'Child added successfully!',
                'child': ChildSerializer(child).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({
            'error': 'Invalid age value'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def child_detail(request, child_id):
    """Get, update, or delete a specific child"""
    try:
        parent = Parent.objects.get(user=request.user)
        child = Child.objects.get(id=child_id, parent=parent)
        
        if request.method == 'GET':
            serializer = ChildSerializer(child)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = ChildSerializer(child, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Child updated successfully',
                    'child': serializer.data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            child.delete()
            return Response({
                'message': 'Child deleted successfully'
            }, status=status.HTTP_200_OK)
            
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Child.DoesNotExist:
        return Response({
            'error': 'Child not found or does not belong to you'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_child_online(request, child_id):
    """Toggle child online/offline status"""
    try:
        parent = Parent.objects.get(user=request.user)
        child = Child.objects.get(id=child_id, parent=parent)
        
        child.online = not child.online
        child.save()
        
        return Response({
            'message': f'Child is now {"online" if child.online else "offline"}',
            'online': child.online
        })
        
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Child.DoesNotExist:
        return Response({
            'error': 'Child not found'
        }, status=status.HTTP_404_NOT_FOUND)

# ============================================================================
# ACTIVITY TRACKING
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity(request, child_id):
    """Log daily activity for a child"""
    try:
        parent = Parent.objects.get(user=request.user)
        child = Child.objects.get(id=child_id, parent=parent)
        
        # Get or create today's activity
        from django.utils import timezone
        today = timezone.now().date()
        
        activity, created = Activity.objects.get_or_create(
            child=child,
            date=today,
            defaults={
                'screen_time': 0,
                'goals_completed': 0,
                'goals_total': 0,
                'learning_time': 0,
                'routine_completed': False,
                'family_activities': 0
            }
        )
        
        # Update with provided data
        if 'screen_time' in request.data:
            activity.screen_time = float(request.data['screen_time'])
        if 'goals_completed' in request.data:
            activity.goals_completed = int(request.data['goals_completed'])
        if 'goals_total' in request.data:
            activity.goals_total = int(request.data['goals_total'])
        if 'learning_time' in request.data:
            activity.learning_time = float(request.data['learning_time'])
        if 'routine_completed' in request.data:
            activity.routine_completed = request.data['routine_completed']
        if 'family_activities' in request.data:
            activity.family_activities = int(request.data['family_activities'])
        
        activity.save()
        
        return Response({
            'message': 'Activity logged successfully',
            'activity': ActivitySerializer(activity).data
        })
        
    except Parent.DoesNotExist:
        return Response({
            'error': 'Parent profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Child.DoesNotExist:
        return Response({
            'error': 'Child not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({
            'error': f'Invalid data: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)