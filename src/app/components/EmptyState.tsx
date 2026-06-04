import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {description}
            </p>
          </div>
          {action && (
            <div className="pt-2">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
