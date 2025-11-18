// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.querySelector('.nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

// Current year in footer
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Wheel functionality
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const successMessage = document.getElementById('successMessage');
const discountAmount = document.getElementById('discountAmount');
const discountCode = document.getElementById('discountCode');
let isSpinning = false;

if (spinBtn && wheel && successMessage) {
  spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = 'Tourne...';
    
    // Hide previous success message
    successMessage.style.display = 'none';
    
    // Generate random rotation (multiple full turns + random segment)
    const baseRotation = 1800; // 5 full turns
    const segmentAngle = 36; // Each segment is 36 degrees
    const randomSegment = Math.floor(Math.random() * 10);
    const finalRotation = baseRotation + (randomSegment * segmentAngle);
    
    // Apply rotation
    wheel.style.transform = `rotate(${finalRotation}deg)`;
    
    // After animation completes
    setTimeout(() => {
      const segments = wheel.querySelectorAll('.wheel-segment');
      const winningSegment = segments[randomSegment];
      const discount = winningSegment.dataset.discount;
      
      // Show success message
      discountAmount.textContent = discount;
      discountCode.textContent = `MRBIG${discount.replace('%', '')}`;
      successMessage.style.display = 'block';
      
      // Reset button
      spinBtn.disabled = false;
      spinBtn.textContent = 'Tourner la roue';
      isSpinning = false;
      
      // Scroll to success message
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 3000);
  });
}

// Modal Contact Form
const contactModal = document.getElementById('contactModal');
const openContactFormBtn = document.getElementById('openContactForm');
const openContactFormSection = document.getElementById('openContactFormSection');
const closeModalBtn = document.getElementById('closeModal');
const contactForm = document.getElementById('contactForm');

// URL de votre API Backend
const API_URL = 'https://crm-backend-nwl9.onrender.com';

// Function to open modal
function openModal() {
  if (contactModal) {
    contactModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

// Open modal from all buttons
if (openContactFormBtn && contactModal) {
  openContactFormBtn.addEventListener('click', openModal);
}

if (openContactFormSection && contactModal) {
  openContactFormSection.addEventListener('click', openModal);
}

// Close modal
if (closeModalBtn && contactModal) {
  closeModalBtn.addEventListener('click', () => {
    contactModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  });
}

// Close modal when clicking outside
if (contactModal) {
  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
      contactModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
}

// Handle form submission - CONNEXION À L'API CRM
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    
    // Désactiver le bouton pendant l'envoi
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
    
    try {
      // Préparer les données pour l'API
      const orderData = {
        customer_name: `${prenom} ${nom}`,  // Concaténation prénom + nom
        customer_phone: telephone,
        customer_email: email,
        source: 'landing-page-mrbigcream'
      };
      
      // Envoyer à l'API
      const response = await fetch(`${API_URL}/api/orders/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      // Vérifier le statut de la réponse
      if (!response.ok) {
        // Si la réponse n'est pas OK, essayer de lire le JSON d'erreur
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Erreur HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Succès : afficher message et fermer le modal
        alert('✅ Merci ! Votre demande a été envoyée avec succès. Notre spécialiste vous contactera rapidement.');
        
        // Reset form
        contactForm.reset();
        
        // Close modal
        contactModal.style.display = 'none';
        document.body.style.overflow = '';
        
        console.log('Commande créée avec succès:', result);
      } else {
        // Erreur de l'API
        const errorMsg = result.error || result.message || 'Une erreur est survenue';
        throw new Error(errorMsg);
      }
    } catch (error) {
      // Erreur réseau ou autre
      console.error('Erreur lors de l\'envoi:', error);
      console.error('URL appelée:', `${API_URL}/api/orders/external`);
      console.error('Données envoyées:', orderData);
      
      let errorMessage = '❌ Erreur de connexion. ';
      if (error.message.includes('404') || error.message.includes('Route non trouvée')) {
        errorMessage += 'L\'endpoint API n\'est pas accessible. Veuillez contacter le support technique.';
      } else if (error.message.includes('CORS') || error.message.includes('origin')) {
        errorMessage += 'Problème de configuration CORS. Veuillez contacter le support technique.';
      } else {
        errorMessage += error.message || 'Veuillez vérifier votre connexion internet et réessayer.';
      }
      
      alert(errorMessage);
    } finally {
      // Réactiver le bouton
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}



