from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from django.contrib.auth.models import User
from .models import Parent , Child
from .serializers import ParentSerializer , ChildSerializer
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework import generics
from rest_framework import status
# from .serializers import DashboardSerializer
# Create your views here.

@api_view(['POST'])
def add_child(request):
    try:
        parent_id = request.data.get('parent_id')
        name = request.data.get('name')
        age = request.data.get('age')

        if not (parent_id and name and age):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        parent = Parent.objects.get(id=parent_id)
        child = Child.objects.create(parent=parent, name=name, age=age)
        serializer = ChildSerializer(child)

        return Response({'message': 'Child added successfully', 'child': serializer.data}, status=status.HTTP_201_CREATED)
    except Parent.DoesNotExist:
        return Response({'error': 'Parent not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET'])
def api_home(request):
    return Response({"message" : "Welcome to Techy Parent API!"})


@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    
    parent = Parent.objects.create(name=username, email=email)
    user.save()
    return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)



@api_view(['GET'])
def get_dashboard(request):
    parent = Parent.objects.first()  # get first parent (for demo)
    serializer = ParentSerializer(parent)
    return Response(serializer.data)
