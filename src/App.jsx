import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Zap, Trash2, Plus } from 'lucide-react';
import io from 'socket.io-client';

const RealtimeEventBoard = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    attendees: 0
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // Setup Socket.io connection
  useEffect(() => {
    const newSocket = io('https://event-client-production.up.railway.app');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    // Terima initial events
    newSocket.on('initial-events', (initialEvents) => {
      setEvents(initialEvents);
      addNotification('Events loaded successfully');
    });

    // Event baru ditambahkan
    newSocket.on('event-added', (event) => {
      setEvents(prev => [event, ...prev]);
      addNotification(`Event "${event.title}" ditambahkan`);
    });

    // Event diupdate
    newSocket.on('event-updated', (updatedEvent) => {
      setEvents(prev => prev.map(e => 
        e.id === updatedEvent.id ? updatedEvent : e
      ));
      addNotification(`${updatedEvent.title} - ${updatedEvent.attendees} peserta`);
    });

    // Event dihapus
    newSocket.on('event-deleted', (eventId) => {
      setEvents(prev => {
        const event = prev.find(e => e.id === eventId);
        if (event) {
          addNotification(`Event "${event.title}" dihapus`);
        }
        return prev.filter(e => e.id !== eventId);
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      addNotification('Mohon lengkapi semua field');
      return;
    }

    if (socket && socket.connected) {
      socket.emit('add-event', {
        ...newEvent,
        attendees: parseInt(newEvent.attendees) || 0
      });
      
      setNewEvent({
        title: '',
        date: '',
        time: '',
        location: '',
        attendees: 0
      });
    } else {
      addNotification('Tidak terhubung ke server');
    }
  };

  const handleDeleteEvent = (id) => {
    if (socket && socket.connected) {
      socket.emit('delete-event', id);
    }
  };

  const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
  const tanggal = date.getDate();
  const bulan = date.toLocaleDateString('id-ID', { month: 'short' });
  const tahun = date.getFullYear();
  
  return `${hari}, ${tanggal} ${bulan} ${tahun}`;
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="bg-white text-gray-800 px-4 py-3 rounded-lg shadow-lg animate-pulse"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{notif.message}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                📡 Realtime Event Board
              </h1>
              <p className="text-white/70">Papan Informasi Acara dengan Socket.io</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                'bg-red-400'
              }`} />
              <span className="text-white font-medium capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Add Event */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Tambah Event
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2 text-sm">Judul Event</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Nama event..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2 text-sm">Tanggal</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2 text-sm">Waktu</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2 text-sm">Lokasi</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Lokasi event..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2 text-sm">Jumlah Peserta</label>
                  <input
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({...newEvent, attendees: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    min="0"
                  />
                </div>
                <button
                  onClick={handleAddEvent}
                  disabled={connectionStatus !== 'connected'}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectionStatus === 'connected' ? 'Tambah Event' : 'Connecting...'}
                </button>
              </div>
            </div>
          </div>

          {/* Event List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                  <Calendar className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">Belum ada event yang dijadwalkan</p>
                </div>
              ) : (
                events.map(event => (
                  <div
                    key={event.id}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white">{event.title}</h3>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-white/90">
                        <Calendar className="w-5 h-5 text-pink-400" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <span>{event.time} WIB</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <Users className="w-5 h-5 text-green-400" />
                        <span className="font-semibold">{event.attendees} Peserta</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/60 text-sm">
                          Live Update • {new Date(event.timestamp).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeEventBoard;