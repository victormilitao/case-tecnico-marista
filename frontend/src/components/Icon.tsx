import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
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
  settings: Settings,
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
