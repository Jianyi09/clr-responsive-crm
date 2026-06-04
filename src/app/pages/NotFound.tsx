import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Página no encontrada</CardTitle>
          <CardDescription>
            La página que buscas no existe o ha sido movida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/">
            <Button className="bg-[#0066CC] hover:bg-[#0052A3]">
              Volver al Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
