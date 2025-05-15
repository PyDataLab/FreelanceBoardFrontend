'use client';

import { useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type Kwork = {
  id: number;
  link: string;
  title: string;
  description: string;
  price: number;
  status: 'new' | 'reason' | 'favorite';
  reason: string;
};

export default function Home() {
  const [kworks, setKworks] = useState<Kwork[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [reason, setReason] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [status, setStatus] = useState<Kwork['status']>('new');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchKworks = async () => {
    try {
      const res = await fetch('http://localhost:3000/kwork');
      if (!res.ok) throw new Error('Ошибка при загрузке данных');
      const data = await res.json();
      setKworks(data);
    } catch (err: any) {
      setError(err.message || 'Неизвестная ошибка');
    }
  };

  useEffect(() => {
    fetchKworks();
  }, []);

  const groupedKworks = {
    reason: kworks.filter(k => k.reason !== '' && k.status !== 'favorite'),
    new: kworks.filter(k => k.reason === '' && k.status === 'new'),
    favorite: kworks.filter(k => k.status === 'favorite'),
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const column = source.droppableId as keyof typeof groupedKworks;
    const items = Array.from(groupedKworks[column]);
    const [moved] = items.splice(source.index, 1);
    items.splice(destination.index, 0, moved);

    // Обновляем порядок локально (не на сервере, если не требуется)
    const reordered = kworks.filter(k => k.status !== column);
    setKworks([...reordered, ...items]);
  };

  const onReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReason(val);
    setStatus(val.trim() !== '' ? 'reason' : 'new');
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStatus('new');
    setLink('');
    setReason('');
    setOpenDialog(true);
  };

  const openEditDialog = (kwork: Kwork) => {
    setEditingId(kwork.id);
    setTitle(kwork.title);
    setDescription(kwork.description);
    setPrice(kwork.price);
    setStatus(kwork.status);
    setLink(kwork.link);
    setReason(kwork.reason);
    setOpenDialog(true);
  };

  const toggleFavorite = async (kwork: Kwork, favorite: boolean) => {
    try {
      const newStatus: Kwork['status'] = favorite ? 'favorite' : (kwork.reason !== '' ? 'reason' : 'new');
      const res = await fetch(`http://localhost:3000/kwork/${kwork.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении статуса');
      const updated = await res.json();
      setKworks((prev) =>
        prev.map((k) => (k.id === kwork.id ? updated : k))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка');
    }
  };

  const deleteKwork = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
      const res = await fetch(`http://localhost:3000/kwork/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Ошибка при удалении задачи');

      setKworks((prev) => prev.filter(k => k.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !price || !link) {
      alert('Заполните все поля');
      return;
    }

    try {
      if (editingId === null) {
        const res = await fetch('http://localhost:3000/kwork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, price, link, status, reason }),
        });
        if (!res.ok) throw new Error('Ошибка при сохранении');

        const newTask = await res.json();
        setKworks((prev) => [...prev, newTask]);
      } else {
        const res = await fetch(`http://localhost:3000/kwork/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, price, status, link, reason }),
        });
        if (!res.ok) throw new Error('Ошибка при обновлении');

        const updatedTask = await res.json();
        setKworks((prev) =>
          prev.map((k) => (k.id === editingId ? updatedTask : k))
        );
      }

      setOpenDialog(false);
      setEditingId(null);
      setTitle('');
      setDescription('');
      setPrice('');
      setStatus('new');
      setLink('');
      setReason('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка');
    }
  };

  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📋 FreelanceBoard</h1>
        <Button onClick={openCreateDialog}>+ Новая задача</Button>
      </header>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId === null ? 'Создание новой задачи' : 'Редактирование задачи'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Заголовок задачи" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Ссылка" value={link} onChange={(e) => setLink(e.target.value)} />
            <Textarea placeholder="Описание задачи" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Textarea placeholder="Причина отказа (если есть)" value={reason} onChange={onReasonChange} />
            <Input type="number" placeholder="Бюджет ₽" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <Button type="submit">Сохранить</Button>
          </form>
        </DialogContent>
      </Dialog>

      {error && <div className="text-red-600 mb-4">Ошибка: {error}</div>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['new', 'reason', 'favorite'] as Kwork['status'][]).map((statusKey) => (
            <div key={statusKey}>
              <h2 className="text-lg font-semibold mb-2">
                {statusKey === 'new' ? 'Новые заказы' : statusKey === 'reason' ? 'Причина отказа' : 'Избранное'}
              </h2>
              <Droppable droppableId={statusKey}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 min-h-[50px]">
                    {groupedKworks[statusKey].map((kwork, index) => (
                      <Draggable key={kwork.id.toString()} draggableId={kwork.id.toString()} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <CardContent className="p-4 space-y-2">
                              <a
                                href={kwork.link}
                                className="text-blue-600 font-medium underline underline-offset-3"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {kwork.title}
                              </a>
                              <p className="text-sm">{kwork.description}</p>
                              {kwork.status === 'reason' && kwork.reason && (
                                <p className="text-sm italic text-red-600">Причина отказа: {kwork.reason}</p>
                              )}
                              <p className="text-right text-sm font-semibold">{kwork.price} ₽</p>
                              <div className="flex items-center justify-between">
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(kwork)}>Редактировать</Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteKwork(kwork.id)}>Удалить</Button>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={kwork.status === 'favorite'}
                                    onCheckedChange={(checked) => toggleFavorite(kwork, checked)}
                                    id={`favorite-switch-${kwork.id}`}
                                  />
                                  <label htmlFor={`favorite-switch-${kwork.id}`} className="select-none text-sm">
                                    Избранное
                                  </label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
