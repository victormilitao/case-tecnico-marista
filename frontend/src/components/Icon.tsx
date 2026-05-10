import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  UserCog,
  X,
  type LucideProps,
} from 'lucide-react';

const icons = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'graduation-cap': GraduationCap,
  'log-out': LogOut,
  menu: Menu,
  moon: Moon,
  settings: Settings,
  sun: Sun,
  user: User,
  'user-cog': UserCog,
  close: X,
} as const;

export type IconName = keyof typeof icons;

type IconProps = Omit<LucideProps, 'ref'> & {
  name: IconName;
};

export function Icon({ name, ...props }: IconProps) {
  const Component = icons[name];
  return <Component {...props} />;
}
