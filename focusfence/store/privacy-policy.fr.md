# Politique de confidentialité de FocusFence

_Date d’effet : 14 novembre 2026_

_Ceci est une traduction. En cas de divergence, la [version anglaise](../privacy.html) fait foi._

FocusFence (« l’extension ») est une extension Chrome qui bloque les sites de votre choix pour vous aider à rester concentré. Elle est conçue pour fonctionner entièrement sur votre appareil. Cette politique explique ce que l’extension enregistre, ce qu’elle envoie (très peu) sur le réseau et les choix dont vous disposez.

## En bref

- **Pas de compte, pas de statistiques d’audience, pas de pistage, pas de publicité.** Nous n’exploitons aucun serveur et ne recevons jamais vos données.
- **Votre liste de blocage, vos réglages et vos statistiques restent sur votre appareil**, dans le stockage local des extensions de Chrome.
- **L’extension ne lit pas le contenu des pages.** Le blocage est assuré par le moteur `declarativeNetRequest` intégré à Chrome, qui compare les adresses à votre liste sans exposer votre navigation à l’extension.
- **La seule communication réseau a lieu avec ExtensionPay**, et seulement si vous choisissez de passer à Pro (détails ci-dessous).

## Ce qui est enregistré sur votre appareil

| Donnée | Pourquoi | Où |
|---|---|---|
| Votre liste de blocage (domaines, chemins, mots-clés) | Pour bloquer ces sites | `chrome.storage.local` |
| Réglages (marche/arrêt, planning, durées des sessions, message de la page de blocage) | Pour appliquer vos préférences | `chrome.storage.local` |
| Minuteurs des sessions de concentration et du mode strict | Pour que les sessions continuent après un redémarrage du navigateur | `chrome.storage.local` |
| Nombre de tentatives bloquées par site bloqué et par jour (90 derniers jours) | Pour afficher vos statistiques (tentatives bloquées aujourd’hui et cette semaine) | `chrome.storage.local` |
| Verrouillage par mot de passe : une empreinte PBKDF2-SHA-256 salée (jamais le mot de passe lui-même) | Pour protéger vos réglages | `chrome.storage.local` |
| État de votre licence Pro (Pro actif ou non, la formule, la date de la dernière vérification) | Pour débloquer Pro, même hors connexion | `chrome.storage.local` |
| Indicateur « déverrouillé » pendant 15 minutes après la saisie du mot de passe | Confort | `chrome.storage.session` (effacé à la fermeture du navigateur) |
| Nombre de mots de passe erronés (pour ralentir les tentatives) | Sécurité | `chrome.storage.session` (effacé à la fermeture du navigateur) |

Les statistiques n’enregistrent que les visites **bloquées**, étiquetées par la règle correspondante (par exemple `reddit.com`). FocusFence ne conserve pas d’historique des sites que vous visitez.

Vous pouvez effacer les statistiques à tout moment (Réglages → Statistiques → Effacer les statistiques). La désinstallation de l’extension supprime toutes les données ci-dessus.

## Ce qui quitte votre appareil

**Rien, sauf si vous décidez de passer à Pro.**

Les paiements sont gérés par [ExtensionPay](https://extensionpay.com), un service de paiement pour extensions de navigateur qui utilise Stripe pour le traitement des cartes. Quand vous cliquez sur un bouton de passage à Pro ou de « restauration d’achat » :

1. L’extension demande à ExtensionPay un identifiant aléatoire (une clé d’API) pour votre installation et ouvre la page de paiement d’ExtensionPay dans un nouvel onglet.
2. Vous saisissez vos informations de paiement et votre e-mail **directement sur les pages d’ExtensionPay/Stripe**. FocusFence ne voit ni n’enregistre jamais vos données de carte.
3. Ensuite, l’extension envoie périodiquement cet identifiant à ExtensionPay (au démarrage du navigateur, environ toutes les 12 heures et à l’ouverture des réglages) pour vérifier si votre abonnement est actif. Aucune donnée de navigation, liste de blocage ou statistique n’est jamais envoyée.

Dans `chrome.storage.sync`, la bibliothèque ExtensionPay enregistre l’identifiant, la date d’installation et la fiche qu’ExtensionPay renvoie pour cet identifiant : l’état de votre abonnement et votre formule et, une fois que vous avez payé, la date du paiement et l’adresse e-mail avec laquelle vous avez payé. Si la synchronisation Chrome est activée, Chrome synchronise ces données avec votre compte Google pour que votre achat vous suive sur vos autres ordinateurs. La politique de confidentialité d’ExtensionPay s’applique aux données que vous lui fournissez : <https://extensionpay.com/privacy>.

## Permissions et raisons

- **storage** : enregistrer localement votre liste, vos réglages et vos statistiques.
- **declarativeNetRequest** : permettre à Chrome de bloquer ou de rediriger la navigation vers les sites de votre liste.
- **alarms** : faire fonctionner les plannings, les minuteurs de concentration et du mode strict.
- **activeTab** : lire l’adresse de l’onglet courant uniquement quand vous ouvrez la fenêtre de FocusFence, pour le bloquer en un clic.
- **scripting** : pour les règles de chemin (par ex. `youtube.com/shorts`), enregistrer un petit script uniquement sur ce site afin de bloquer aussi la navigation interne. Il transmet seulement l’adresse de la page à FocusFence ; il ne lit ni ne modifie le contenu de la page.
- **Accès facultatif aux sites** : demandé site par site, quand vous ajoutez ce site, pour que FocusFence affiche sa page de blocage au lieu de la page d’erreur de Chrome. Si vous refusez, le site reste bloqué.
- **extensionpay.com** : le script d’ExtensionPay ne s’exécute que sur extensionpay.com, pour confirmer un paiement effectué.

## Enfants

FocusFence ne s’adresse pas aux enfants de moins de 13 ans et ne collecte sciemment aucune information personnelle, de qui que ce soit.

## Vente et partage des données

Nous ne vendons, ne louons ni ne partageons vos données. Nous ne les utilisons ni ne les transférons à des fins sans rapport avec l’objectif unique de l’extension, et nous ne les utilisons pas pour évaluer une solvabilité ou accorder un crédit.

## Open source

FocusFence est un logiciel libre sous licence GNU Affero General Public License v3 (ou ultérieure). Vous pouvez vérifier chaque affirmation de cette politique dans le code source : <https://github.com/Nexarion434/focusfence>.

## Modifications

Si cette politique change, la nouvelle version sera publiée à la même adresse avec une nouvelle date d’effet. Les changements importants seront signalés dans les notes de version de l’extension.

## Contact

Questions sur la confidentialité : **{{CONTACT}}**
