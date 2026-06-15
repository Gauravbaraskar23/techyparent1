from django.urls import path
from .views import (
    # Learning Suggestions
    LearningCategoryListView,
    ChildInterestView,
    GenerateSuggestionsView,
    SuggestionActionView,
    LearningDashboardView,
    AchievementsView,

    # Chatbot
    StartChatSessionView,
    SendMessageView,
    GetChatHistoryView,
    EndChatSessionView,
    QuizView,
    ChatbotPersonalityView,

    # Parent
    ParentProblemReportsView,
)

urlpatterns = [

    # --------------------------------------------------
    # LEARNING SUGGESTIONS
    # --------------------------------------------------

    # Categories
    path('categories/', LearningCategoryListView.as_view(), name='learning-categories'),

    # Child Interests
    path('interests/<int:child_id>/', ChildInterestView.as_view(), name='child-interests'),

    # Suggestions
    path('suggestions/<int:child_id>/', GenerateSuggestionsView.as_view(), name='generate-suggestions'),
    path('suggestions/action/<int:suggestion_id>/', SuggestionActionView.as_view(), name='suggestion-action'),

    # Dashboard
    path('dashboard/<int:child_id>/', LearningDashboardView.as_view(), name='learning-dashboard'),

    # Achievements
    path('achievements/<int:child_id>/', AchievementsView.as_view(), name='achievements'),

    # --------------------------------------------------
    # CHATBOT
    # --------------------------------------------------

    # Session management
    path('chat/start/', StartChatSessionView.as_view(), name='start-chat'),
    path('chat/send/', SendMessageView.as_view(), name='send-message'),
    path('chat/history/<int:session_id>/', GetChatHistoryView.as_view(), name='chat-history'),
    path('chat/end/<int:session_id>/', EndChatSessionView.as_view(), name='end-chat'),

    # Chatbot personality
    path('chat/personality/<int:child_id>/', ChatbotPersonalityView.as_view(), name='chatbot-personality'),

    # Quiz
    path('quiz/<int:child_id>/', QuizView.as_view(), name='quiz'),

    # --------------------------------------------------
    # PARENT VIEWS
    # --------------------------------------------------

    path('parent/reports/<int:child_id>/', ParentProblemReportsView.as_view(), name='problem-reports'),
]