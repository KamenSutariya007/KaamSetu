from django import forms
from django.contrib.auth import get_user_model
from services.models import ServiceCategory, PriceRange
from passport.models import HouseholdAsset
from support.models import SupportTicket

User = get_user_model()


class LoginForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'Enter your username or email',
            'autocomplete': 'username',
            'required': True,
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-input',
            'placeholder': 'Enter your password',
            'autocomplete': 'current-password',
            'required': True,
        })
    )
    remember_me = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={'class': 'form-checkbox'})
    )


class LoginOTPForm(forms.Form):
    login_challenge = forms.CharField(widget=forms.HiddenInput())
    otp = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'class': 'form-input form-otp-input',
            'placeholder': '000000',
            'maxlength': '6',
            'inputmode': 'numeric',
            'autocomplete': 'one-time-code',
            'required': True,
        })
    )


class RegistrationForm(forms.Form):
    ROLE_CHOICES = [
        ('CUSTOMER', 'Customer / Homeowner'),
        ('INDIVIDUAL_PROVIDER', 'Individual Professional (કારીગર)'),
        ('THIRD_PARTY_PARTNER', 'Third Party Company (સર્વિસ પાર્ટનર)'),
    ]
    role = forms.ChoiceField(choices=ROLE_CHOICES, initial='CUSTOMER', widget=forms.RadioSelect)
    first_name = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'First Name'}))
    last_name = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Last Name'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-input', 'id': 'reg_email', 'placeholder': 'name@example.com'}))
    verification_token = forms.CharField(required=False, widget=forms.HiddenInput(attrs={'id': 'reg_verification_token'}))
    phone = forms.CharField(max_length=15, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': '9876543210'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'At least 8 characters'}))
    password_confirm = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'Confirm your password'}))
    pin_code = forms.CharField(max_length=6, min_length=6, widget=forms.TextInput(attrs={'class': 'form-input', 'id': 'reg_pincode', 'placeholder': '380001'}))
    city = forms.CharField(max_length=100, initial='Ahmedabad', widget=forms.TextInput(attrs={'class': 'form-input', 'id': 'reg_city'}))
    state = forms.CharField(max_length=100, initial='Gujarat', widget=forms.TextInput(attrs={'class': 'form-input', 'id': 'reg_state'}))
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={'class': 'form-textarea', 'rows': 2, 'placeholder': 'House / Flat, Street, Area'}))
    referral_code = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Optional referral code'}))

    # Provider specific
    categories = forms.ModelMultipleChoiceField(
        queryset=ServiceCategory.objects.filter(is_active=True),
        required=False,
        widget=forms.CheckboxSelectMultiple
    )
    experience_years = forms.IntegerField(required=False, initial=3, widget=forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Years of experience'}))
    visit_charge = forms.DecimalField(required=False, initial=199, widget=forms.NumberInput(attrs={'class': 'form-input', 'placeholder': '₹ Visit charge'}))
    service_radius_km = forms.DecimalField(required=False, initial=10, widget=forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Radius in KM'}))
    bio = forms.CharField(required=False, widget=forms.Textarea(attrs={'class': 'form-textarea', 'rows': 2, 'placeholder': 'Brief description of your skills'}))

    # Partner specific
    organization_name = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Company / Firm Name'}))
    partner_type = forms.CharField(required=False, initial='repair_company', widget=forms.TextInput(attrs={'class': 'form-input'}))
    gst_number = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'GSTIN (optional)'}))

    def clean(self):
        cleaned_data = super().clean()
        pwd = cleaned_data.get('password')
        pwd_conf = cleaned_data.get('password_confirm')
        if pwd and pwd_conf and pwd != pwd_conf:
            self.add_error('password_confirm', 'Passwords do not match.')
        return cleaned_data


class ProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address', 'city', 'state', 'pin_code', 'language']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-input'}),
            'last_name': forms.TextInput(attrs={'class': 'form-input'}),
            'phone': forms.TextInput(attrs={'class': 'form-input'}),
            'address': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 2}),
            'city': forms.TextInput(attrs={'class': 'form-input', 'id': 'profile_city'}),
            'state': forms.TextInput(attrs={'class': 'form-input', 'id': 'profile_state'}),
            'pin_code': forms.TextInput(attrs={'class': 'form-input', 'id': 'profile_pincode'}),
            'language': forms.Select(attrs={'class': 'form-select'}),
        }


class ApplianceForm(forms.ModelForm):
    class Meta:
        model = HouseholdAsset
        fields = ['asset_type', 'brand', 'model_name', 'purchase_date', 'warranty_end', 'last_service', 'next_service', 'condition', 'notes']
        widgets = {
            'asset_type': forms.Select(attrs={'class': 'form-select'}),
            'brand': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'e.g., Daikin, Samsung'}),
            'model_name': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'e.g., 1.5 Ton Split Inverter'}),
            'purchase_date': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'warranty_end': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'last_service': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'next_service': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'condition': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 2, 'placeholder': 'Notes or serial number'}),
        }


class SupportTicketForm(forms.ModelForm):
    class Meta:
        model = SupportTicket
        fields = ['category', 'subject', 'description']
        widgets = {
            'category': forms.Select(attrs={'class': 'form-select'}),
            'subject': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Brief summary of your issue'}),
            'description': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 4, 'placeholder': 'Describe what happened and how we can help you'}),
        }
