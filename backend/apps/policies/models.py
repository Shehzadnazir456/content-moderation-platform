from django.db import models

CATEGORY_CHOICES = [
    ('graphic_violence',      'Graphic Violence'),
    ('hate_symbols',          'Hate Symbols'),
    ('self_harm',             'Self-Harm'),
    ('extremist_propaganda',  'Extremist Propaganda'),
    ('weapons_contraband',    'Weapons & Contraband'),
    ('harassment_humiliation','Harassment & Humiliation'),
]

ENFORCEMENT_CHOICES = [
    ('auto_block',   'Auto-Block'),
    ('flag_review',  'Flag for Review'),
]


class Policy(models.Model):
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        unique=True,
    )
    enabled = models.BooleanField(default=True)
    confidence_threshold = models.FloatField(default=70.0)
    enforcement = models.CharField(
        max_length=20,
        choices=ENFORCEMENT_CHOICES,
        default='flag_review',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'policies'

    def __str__(self):
        return self.category
