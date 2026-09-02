export const site = {
  firstName: 'Dominique',
  lastName: 'Stipa',
  name: 'Dominique Stipa',
  tagline: 'Sculpteur plasticien',
  city: 'La Rochelle',
  email: 'ds.stipa@gmail.com',
  instagram: 'https://www.instagram.com/domistipa/',
  instagramHandle: '@domistipa',
  /** slug of the work shown in the home hero */
  heroSlug: 'numero-1',
  /** one-line statement, shown on the home page */
  statement: 'Sans dessin ni canevas. La forme se révèle au sentiment, coup après coup.',
  /** short description for search engines and link previews */
  description:
    'Dominique Stipa, sculpteur à La Rochelle. Une œuvre taillée sans canevas, au sentiment, où chaque geste laisse affleurer l’inconscient.',
  bio: [
    'Dominique Stipa pratique la taille directe : pas de dessin préparatoire, pas de canevas. Devant le bloc, il n’impose pas une forme : il l’écoute. La main avance au sentiment, et la figure se révèle au fil des coups, comme si elle attendait déjà dans la pierre.',
    'Son travail est une exploration poétique et philosophique de l’inconscient. Chaque coup porté dans la pierre, chaque trait posé sur la toile est un geste sans retour, où l’intention s’efface devant ce qui affleure. Les visages et les formes qui en naissent, épurés jusqu’à l’essentiel, gardent la trace de ce dialogue silencieux entre la matière et ce qui, en nous, ne se dit pas.',
    'Artiste sculpteur et plasticien installé à La Rochelle, il travaille la pierre et le plâtre, à l’atelier comme en plein air, et présente son travail lors de salons et d’expositions.',
  ],
  /** short studio videos ("cartes postales"), files in public/videos */
  videos: [
    { title: 'Taille directe', caption: 'Aucun modèle, aucun tracé : le geste décide.', file: '/videos/taille-directe.mp4', poster: '/videos/taille-directe.jpg' },
    { title: 'L’entrée dans l’atelier', caption: 'Carte postale n°1.', file: '/videos/entree-atelier.mp4', poster: '/videos/entree-atelier.jpg' },
    { title: 'Recherche d’inspiration', caption: 'Carte postale n°3.', file: '/videos/recherche-inspiration.mp4', poster: '/videos/recherche-inspiration.jpg' },
    { title: 'Jardinage méticuleux', caption: 'Carte postale n°4.', file: '/videos/jardinage.mp4', poster: '/videos/jardinage.jpg' },
  ],
  expositions: [] as string[], // TODO(famille): liste des expositions, ex. '2025 — Salon « Laissez parler votre imaginaire »'
};
