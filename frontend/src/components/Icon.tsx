import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Menu,
  Settings,
  User,
  X,
  type LucideProps,
} from 'lucide-react';

const icons = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'graduation-cap': GraduationCap,
  menu: Menu,
  settings: Settings,
  user: User,
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
