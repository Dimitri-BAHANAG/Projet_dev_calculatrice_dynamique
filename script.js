// Initialisation de l'API LocalBase (utilisé depuis npm/unpkg en CDN)
let db = new Localbase('calcDB');
db.config.debug = false; // Désactiver les logs debug de localbase

// Variables d'état
let currentOperand = '';
let previousOperand = '';
let operator = null;

// Accès à l'élément DOM d'affichage, très important
const displayElement = document.getElementById('display');

/**
 * Mise à jour de l'affichage de la calculatrice
 */
function updateDisplay() {
    let displayText = '';

    // Afficher l'opérande précédent et l'opérateur s'ils existent
    if (previousOperand !== '') {
        displayText += previousOperand + ' ';
    }
    if (operator != null) {
        displayText += operator + ' ';
    }
    
    // Afficher l'opérande actuel
    if (currentOperand !== '') {
        displayText += currentOperand;
    }

    // Gestion du cas où tout est vide
    if (displayText === '') {
        displayText = '0';
    }

    displayElement.innerText = displayText;
}

/**
 * Ajoute un chiffre ou un point décimal à l'opérande actuel
 * @param {string} digit 
 */
function appendDigit(digit) {
    // Éviter plusieurs décimales dans le même opérande
    if (digit === '.' && currentOperand.includes('.')) return;
    
    // Si la chaîne est vide et on envoie un '.', on met '0.'
    if (currentOperand === '' && digit === '.') {
        currentOperand = '0.';
    } else {
        currentOperand = currentOperand.toString() + digit.toString();
    }
    
    updateDisplay();
}

/**
 * Définit ou change l'opérateur en cours
 * @param {string} op 
 */
function setOperator(op) {
    if (currentOperand === '' && previousOperand === '') return;
    
    // Possibilité de changer l'opérateur en plein milieu s'il n'y a pas d'opérande courant
    if (currentOperand === '' && previousOperand !== '') {
        operator = op;
        updateDisplay();
        return;
    }

    // Si on a déjà les deux opérandes et qu'on saisit un nouvel opérateur, 
    // on calcule d'abord le résultat intermédiaire avant de continuer
    if (previousOperand !== '') {
        calculate();
    }

    operator = op;
    previousOperand = currentOperand;
    currentOperand = '';
    updateDisplay();
}

/**
 * Effectue le calcul basé sur l'opérateur et les opérandes
 */
function calculate() {
    let computation;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);

    // Ne rien faire si on n'a pas deux nombres valides à calculer
    if (isNaN(prev) || isNaN(current)) return;

    switch (operator) {
        case '+':
            computation = prev + current;
            break;
        case '-':
            computation = prev - current;
            break;
        case '*':
            computation = prev * current;
            break;
        case '/':
            // Gérer explicitement la division par zéro
            if (current === 0) {
                alert("Erreur: Impossible de diviser par zéro !");
                clearCalculator();
                return;
            }
            computation = prev / current;
            break;
        default:
            return;
    }

    // Arrondir pour éviter le comportement étrange du JS en précision flottante 
    currentOperand = Math.round(computation * 100000000) / 100000000;
    currentOperand = currentOperand.toString();
    operator = null;
    previousOperand = '';
    updateDisplay();
}

/**
 * Bouton "Effacer" (C) - Réinitialise l'opérande à zéro
 */
function clearCalculator() {
    // Selon la consigne: "Un bouton Effacer (C) permet de réinitialiser l'opérande à zéro."
    // On efface l'opérande en cours.
    if (currentOperand !== '') {
        currentOperand = '';
    } else {
        // Optionnel : un reset complet si l'opérande est déjà vide
        previousOperand = '';
        operator = null;
    }
    updateDisplay();
}

/**
 * Bouton "Enregistrer" - Sauvegarde l'opérande en l'état vers IndexedDB via LocalBase
 */
function saveToDB() {
    const valueToSave = currentOperand || previousOperand || '0';
    
    // Écriture ("collection" équivaut à un tableau de store dans IndexedDB)
    db.collection('operands').doc('savedValue').set({
        value: valueToSave
    }).then(() => {
        alert("La valeur de l'opérande a été bien sauvegardée : " + valueToSave);
    }).catch(error => {
        console.error("Erreur lors de la sauvegarde : ", error);
        alert("Une erreur est subvenue lors de la sauvegarde !");
    });
}

/**
 * Bouton "Synchroniser" - Remplacer l'opérande par sa valeur sauvegardée
 */
function syncFromDB() {
    // Lecture depuis IndexedDB
    db.collection('operands').doc('savedValue').get().then(document => {
        if (document && document.value) {
            currentOperand = document.value.toString();
            // On le définit volontairement comme "currentOperand" pour 
            // lui permettre de faire de nouveaux calculs directement.
            updateDisplay();
            alert("L'opérande a été remplacé avec succès par : " + currentOperand);
        } else {
            alert("Aucune valeur valide trouvée dans la base de données.");
        }
    }).catch(error => {
        console.error("Erreur de synchronisation : ", error);
        alert("Impossible de procéder à la synchronisation !");
    });
}

/**
 * Gestion du clavier pour le support éventuel des frappes de l'utilisateur (Optionnel mais recommandé)
 */
/*
window.addEventListener('keydown', (e) => {
    if (e.key >= 0 && e.key <= 9) appendDigit(e.key);
    if (e.key === '.') appendDigit('.');
    if (e.key === '=' || e.key === 'Enter') calculate();
    if (e.key === 'Backspace') {
        currentOperand = currentOperand.toString().slice(0, -1);
        updateDisplay();
    }
    if (e.key === 'Escape') clearCalculator();
    if (['+', '-', '*', '/'].includes(e.key)) setOperator(e.key);
});
*/

// Appel initial
updateDisplay();
