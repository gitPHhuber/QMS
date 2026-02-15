import { useState, useEffect } from 'react';
import api from '../api/client';
import InstanceCard, { Instance } from '../components/InstanceCard';

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstances();
  }, []);

  async function fetchInstances() {
    try {
      const { data } = await api.get('/portal/instances');
      setInstances(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-txt-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-txt-primary">Инстансы</h1>
        <div className="text-sm text-txt-secondary">
          Всего: {instances.length} | Online:{' '}
          {instances.filter((i) => i.status === 'online').length}
        </div>
      </div>

      {instances.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-txt-secondary/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"
            />
          </svg>
          <h3 className="text-lg font-medium text-txt-primary mb-2">Нет зарегистрированных инстансов</h3>
          <p className="text-txt-secondary text-sm">
            Инстансы появятся автоматически после активации лицензии на сервере
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((inst) => (
            <InstanceCard key={inst.id} instance={inst} />
          ))}
        </div>
      )}
    </div>
  );
}
