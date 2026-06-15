# learningsuggestions/models.py
# Complete models for Learning Suggestions + AI Chatbot module

from django.db import models
from django.utils import timezone
from api.models import Child


# ===========================================================================
# LEARNING SUGGESTIONS
# ===========================================================================

class LearningCategory(models.Model):
    """Categories for learning content"""
    CATEGORY_CHOICES = [
        ('math', 'Mathematics'),
        ('science', 'Science'),
        ('language', 'Language & Reading'),
        ('art', 'Art & Creativity'),
        ('music', 'Music'),
        ('coding', 'Coding & Technology'),
        ('sports', 'Sports & Fitness'),
        ('social', 'Social Skills'),
        ('life_skills', 'Life Skills'),
        ('general', 'General Knowledge'),
    ]

    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default='book-outline')
    color = models.CharField(max_length=7, default='#3b82f6')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = 'Learning Categories'

    def __str__(self):
        return self.display_name


class ChildInterest(models.Model):
    """Track what subjects/topics a child is interested in"""
    LEVEL_CHOICES = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='interests')
    category = models.ForeignKey(LearningCategory, on_delete=models.CASCADE)
    interest_level = models.IntegerField(choices=LEVEL_CHOICES, default=2)
    notes = models.TextField(blank=True, help_text="Parent notes about child's interest")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'category']
        ordering = ['-interest_level']

    def __str__(self):
        return f"{self.child.name} - {self.category.display_name} (Level {self.interest_level})"


class LearningResource(models.Model):
    """Learning resources - videos, books, activities"""
    RESOURCE_TYPES = [
        ('video', 'Video'),
        ('book', 'Book'),
        ('activity', 'Activity'),
        ('game', 'Game'),
        ('worksheet', 'Worksheet'),
        ('website', 'Website'),
        ('podcast', 'Podcast'),
        ('quiz', 'Quiz'),
    ]

    DIFFICULTY_LEVELS = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    AGE_GROUPS = [
        ('3-5', '3-5 years'),
        ('6-8', '6-8 years'),
        ('9-11', '9-11 years'),
        ('12-14', '12-14 years'),
        ('15+', '15+ years'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(LearningCategory, on_delete=models.CASCADE, related_name='resources')
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_LEVELS, default='easy')
    age_group = models.CharField(max_length=10, choices=AGE_GROUPS)
    url = models.URLField(blank=True, help_text="Link to the resource")
    thumbnail_url = models.URLField(blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list, help_text="List of tags for better matching")
    is_free = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'difficulty']

    def __str__(self):
        return f"{self.title} ({self.resource_type})"


class LearningSuggestion(models.Model):
    """Personalized learning suggestions for each child"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='learning_suggestions')
    resource = models.ForeignKey(LearningResource, on_delete=models.CASCADE, related_name='suggestions')
    category = models.ForeignKey(LearningCategory, on_delete=models.SET_NULL, null=True)

    # Why this was suggested
    reason = models.TextField(help_text="Why this was suggested to this child")
    relevance_score = models.FloatField(default=0.0, help_text="0-1 relevance score")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    suggested_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Child feedback
    rating = models.IntegerField(null=True, blank=True, choices=[(1, '⭐'), (2, '⭐⭐'), (3, '⭐⭐⭐'), (4, '⭐⭐⭐⭐'), (5, '⭐⭐⭐⭐⭐')])
    feedback_text = models.TextField(blank=True)

    class Meta:
        ordering = ['-relevance_score', '-suggested_at']
        unique_together = ['child', 'resource']

    def __str__(self):
        return f"{self.child.name} - {self.resource.title} ({self.status})"

    def mark_accepted(self):
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save()

    def mark_completed(self, rating=None, feedback=''):
        self.status = 'completed'
        self.completed_at = timezone.now()
        if rating:
            self.rating = rating
        if feedback:
            self.feedback_text = feedback
        self.save()


class LearningProgress(models.Model):
    """Track overall learning progress per child per category"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='learning_progress')
    category = models.ForeignKey(LearningCategory, on_delete=models.CASCADE)
    resources_completed = models.IntegerField(default=0)
    total_time_minutes = models.IntegerField(default=0)
    avg_rating = models.FloatField(default=0.0)
    streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'category']

    def __str__(self):
        return f"{self.child.name} - {self.category.display_name} Progress"


class DailyLearningGoal(models.Model):
    """Daily learning goals for a child"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='daily_learning_goals')
    date = models.DateField(default=timezone.now)
    target_minutes = models.IntegerField(default=30)
    actual_minutes = models.IntegerField(default=0)
    resources_target = models.IntegerField(default=2)
    resources_completed = models.IntegerField(default=0)
    is_achieved = models.BooleanField(default=False)

    class Meta:
        unique_together = ['child', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.child.name} - {self.date} Goal"

    def check_achievement(self):
        if self.actual_minutes >= self.target_minutes:
            self.is_achieved = True
            self.save()
        return self.is_achieved


# ===========================================================================
# AI CHATBOT
# ===========================================================================

class ChatSession(models.Model):
    """A chat session between child and AI assistant"""
    MOOD_CHOICES = [
        ('happy', 'Happy 😊'),
        ('sad', 'Sad 😢'),
        ('confused', 'Confused 🤔'),
        ('excited', 'Excited 🎉'),
        ('frustrated', 'Frustrated 😤'),
        ('bored', 'Bored 😴'),
        ('neutral', 'Neutral 😐'),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=200, default="New Chat")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    mood_start = models.CharField(max_length=20, choices=MOOD_CHOICES, blank=True)
    mood_end = models.CharField(max_length=20, choices=MOOD_CHOICES, blank=True)
    topic_category = models.CharField(max_length=50, blank=True, help_text="What topic was discussed")
    is_active = models.BooleanField(default=True)
    message_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.child.name} - {self.title} ({self.started_at.date()})"

    def end_session(self, mood_end=''):
        self.is_active = False
        self.ended_at = timezone.now()
        if mood_end:
            self.mood_end = mood_end
        self.save()


class ChatMessage(models.Model):
    """Individual message in a chat session"""
    SENDER_CHOICES = [
        ('child', 'Child'),
        ('assistant', 'AI Assistant'),
        ('system', 'System'),
    ]

    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('suggestion', 'Learning Suggestion'),
        ('quiz', 'Quiz Question'),
        ('encouragement', 'Encouragement'),
        ('resource', 'Resource Link'),
        ('emotion', 'Emotion Check'),
    ]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True, help_text="Extra data like resource links, quiz answers")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"


class ChatbotPersonality(models.Model):
    """Chatbot personality settings per child"""
    child = models.OneToOneField(Child, on_delete=models.CASCADE, related_name='chatbot_personality')
    bot_name = models.CharField(max_length=50, default='Techy')
    personality_type = models.CharField(
        max_length=20,
        choices=[
            ('friendly', 'Friendly & Warm'),
            ('encouraging', 'Encouraging Coach'),
            ('fun', 'Fun & Playful'),
            ('calm', 'Calm & Patient'),
        ],
        default='friendly'
    )
    use_emojis = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default='en')
    difficulty_level = models.CharField(
        max_length=10,
        choices=[('simple', 'Simple'), ('normal', 'Normal'), ('advanced', 'Advanced')],
        default='normal'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.child.name} - {self.bot_name} ({self.personality_type})"


class ProblemReport(models.Model):
    """When child reports a problem through chatbot"""
    PROBLEM_CATEGORIES = [
        ('homework', 'Homework Help'),
        ('bullying', 'Bullying'),
        ('friendship', 'Friendship Issue'),
        ('family', 'Family Problem'),
        ('health', 'Health Concern'),
        ('emotion', 'Emotional Issue'),
        ('learning', 'Learning Difficulty'),
        ('other', 'Other'),
    ]

    SEVERITY_LEVELS = [
        ('low', 'Low - Minor issue'),
        ('medium', 'Medium - Needs attention'),
        ('high', 'High - Urgent'),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='problem_reports')
    session = models.ForeignKey(ChatSession, on_delete=models.SET_NULL, null=True)
    category = models.CharField(max_length=20, choices=PROBLEM_CATEGORIES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS, default='low')
    description = models.TextField()
    ai_response = models.TextField(help_text="How chatbot responded")
    parent_notified = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.child.name} - {self.category} ({self.severity})"

    def resolve(self):
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()


class QuizQuestion(models.Model):
    """Quiz questions for learning reinforcement"""
    category = models.ForeignKey(LearningCategory, on_delete=models.CASCADE, related_name='quiz_questions')
    question = models.TextField()
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=1, choices=[('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')])
    explanation = models.TextField(help_text="Explanation of correct answer")
    difficulty = models.CharField(max_length=10, choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='easy')
    age_group = models.CharField(max_length=10, default='6-8')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category.display_name} - {self.question[:50]}"


class ChildQuizAttempt(models.Model):
    """Track quiz attempts by child"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='quiz_attempts')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    session = models.ForeignKey(ChatSession, on_delete=models.SET_NULL, null=True)
    selected_answer = models.CharField(max_length=1)
    is_correct = models.BooleanField(default=False)
    time_taken_seconds = models.IntegerField(default=0)
    attempted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        result = "✓" if self.is_correct else "✗"
        return f"{result} {self.child.name} - {self.question.question[:30]}"


class Achievement(models.Model):
    """Achievements/badges for children"""
    ACHIEVEMENT_TYPES = [
        ('streak', 'Learning Streak'),
        ('completion', 'Resource Completed'),
        ('quiz', 'Quiz Master'),
        ('explorer', 'Category Explorer'),
        ('helpful', 'Problem Solver'),
        ('consistent', 'Consistent Learner'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    icon_name = models.CharField(max_length=50, default='trophy-outline')
    color = models.CharField(max_length=7, default='#f59e0b')
    points = models.IntegerField(default=10)
    requirement_value = models.IntegerField(default=1, help_text="Value needed to earn this achievement")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.achievement_type})"


class ChildAchievement(models.Model):
    """Achievements earned by a child"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    points_earned = models.IntegerField(default=0)

    class Meta:
        unique_together = ['child', 'achievement']

    def __str__(self):
        return f"{self.child.name} - {self.achievement.name}"