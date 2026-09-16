import { List, UserPlus, BarChart3, GitBranch, Copy, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Chemin de la route. La Sidebar distante attend `path`, la locale `to` :
   *  les deux sont dérivés d'ici (voir NAV_SECTIONS_REMOTE / NAV_SECTIONS_LOCAL). */
  path: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Source unique du menu latéral.
 *
 * Deux composants la consomment : la Sidebar distante montée par AppLayout
 * (Module Federation) et la Sidebar locale qui sert de repli. Les tenir
 * séparées faisait diverger les deux menus.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Clients',
    items: [
      { icon: List, label: 'Liste clients', path: '/clients' },
      { icon: UserPlus, label: 'Nouveau client', path: '/clients/add' },
      { icon: BarChart3, label: 'Tableau de bord', path: '/clients/dashboard' },
      { icon: Copy, label: 'Doublons', path: '/clients/duplicates' },
    ],
  },
  {
    label: 'Opportunités',
    items: [
      { icon: List, label: 'Liste', path: '/opportunities' },
      { icon: GitBranch, label: 'Pipeline', path: '/opportunities/pipeline' },
      { icon: BarChart3, label: 'Tableau de bord', path: '/opportunities/dashboard' },
    ],
  },
  {
    label: 'Paramètres',
    items: [
      { icon: Tags, label: "Secteurs d'activité", path: '/settings/sectors' },
    ],
  },
];
