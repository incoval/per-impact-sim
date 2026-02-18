import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ClientData {
  nom: string;
  prenom: string;
  age: string;
}

interface ClientInfoProps {
  data: ClientData;
  onChange: (data: ClientData) => void;
}

export default function ClientInfo({ data, onChange }: ClientInfoProps) {
  const update = (field: keyof ClientData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="rounded-xl bg-card card-shadow p-5">
      <h3 className="text-lg font-semibold mb-4">Informations client</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nom</Label>
          <Input
            value={data.nom}
            onChange={(e) => update('nom', e.target.value)}
            placeholder="Dupont"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prénom</Label>
          <Input
            value={data.prenom}
            onChange={(e) => update('prenom', e.target.value)}
            placeholder="Jean"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Âge</Label>
          <Input
            type="number"
            value={data.age}
            onChange={(e) => update('age', e.target.value)}
            placeholder="45"
          />
        </div>
      </div>
    </div>
  );
}
