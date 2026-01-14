#!/bin/bash

echo "🔧 Configuration de l'environnement virtuel Python..."

python3 -m venv venv

source venv/bin/activate

echo "📦 Installation des dépendances..."
pip install -r requirements.txt

echo "Installation terminée!"
echo ""
echo "Pour utiliser le script de brute force:"
echo "  1. Activez l'environnement: source venv/bin/activate"
echo "  2. Lancez le test: python brute_force.py --email <email>"
echo "  3. Désactivez l'environnement: deactivate"
