import React, { useState, useRef } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  Facebook,
  Instagram,
  Download,
  UserPlus,
  FolderOpen,
  X,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const initialContacts = [
  { id: 1, name: 'Alex Johnson', email: 'alex@example.com', source: 'Instagram', status: 'Subscribed', lastActive: '2h ago', tags: ['Lead', 'High Intent'], folder: 'Inquiry' },
  { id: 2, name: 'Sarah Miller', email: 'sarah.m@gmail.com', source: 'Messenger', status: 'Subscribed', lastActive: '5h ago', tags: ['Customer'], folder: 'Customers' },
  { id: 3, name: 'James Wilson', email: 'jw@company.co', source: 'Direct', status: 'Unsubscribed', lastActive: '2 days ago', tags: ['Cold'], folder: 'Leads' },
  { id: 4, name: 'Emma Davis', email: 'emma@davis.io', source: 'Instagram', status: 'Subscribed', lastActive: '15m ago', tags: ['VIP', 'Lead'], folder: 'Customers' },
  { id: 5, name: 'Michael Brown', email: 'mbrown@tech.net', source: 'Messenger', status: 'Subscribed', lastActive: '12h ago', tags: ['Inquiry'], folder: 'Leads' },
  { id: 6, name: 'Lisa Anderson', email: 'lisa.a@house.com', source: 'Instagram', status: 'Subscribed', lastActive: '1h ago', tags: ['Lead'], folder: 'Inquiry' },
  { id: 7, name: 'David Clark', email: 'clark@work.com', source: 'Direct', status: 'Subscribed', lastActive: '4h ago', tags: ['Follow-up'], folder: 'Follow-ups' },
];

export default function ContactList() {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = Array.from(new Set(contacts.map(c => c.folder)));

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder ? contact.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Source', 'Status', 'Last Active', 'Tags', 'Folder'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(c => [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.source}"`,
        `"${c.status}"`,
        `"${c.lastActive}"`,
        `"${c.tags.join('|')}"`,
        `"${c.folder}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const newContacts = rows.slice(1).filter(row => row.length > 5).map((row, index) => {
        const columns = row.split(',').map(col => col.replace(/"/g, ''));
        return {
          id: contacts.length + index + 1,
          name: columns[0] || 'Imported User',
          email: columns[1] || 'imported@example.com',
          source: columns[2] || 'Import',
          status: columns[3] || 'Subscribed',
          lastActive: 'Just now',
          tags: (columns[5] || 'Imported').split('|'),
          folder: columns[6] || 'Uncategorized'
        };
      });
      setContacts([...contacts, ...newContacts]);
      alert(`Successfully imported ${newContacts.length} contacts!`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleBulkImport}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Audience</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage all your contacts and lead data in one place.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-100"
          >
            <UserPlus size={16} />
            Bulk Import
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Folders Sidebar */}
        <div className="w-48 shrink-0 hidden lg:block space-y-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 px-2 italic">Folders</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedFolder(null)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  selectedFolder === null ? "bg-blue-50 text-blue-600" : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                <FolderOpen size={16} />
                All Contacts
              </button>
              {folders.map(folder => (
                <button 
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    selectedFolder === folder ? "bg-blue-50 text-blue-600" : "text-neutral-500 hover:bg-neutral-100"
                  )}
                >
                  <FolderOpen size={16} />
                  {folder}
                </button>
              ))}
            </div>
          </div>
          
          <button className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50">
            <Plus size={16} />
            New Folder
          </button>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, email, or tag..."
                className="w-full rounded-xl border-none bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                isFilterOpen ? "border-blue-200 bg-blue-50 text-blue-600" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Filter size={18} />
              Filter
            </button>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-inner grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Status</label>
                    <select className="w-full bg-neutral-50 border-neutral-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All Statuses</option>
                      <option>Subscribed</option>
                      <option>Unsubscribed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Source</label>
                    <select className="w-full bg-neutral-50 border-neutral-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All Sources</option>
                      <option>Instagram</option>
                      <option>Messenger</option>
                      <option>Direct</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Tag</label>
                    <select className="w-full bg-neutral-50 border-neutral-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All Tags</option>
                      <option>Lead</option>
                      <option>Customer</option>
                      <option>VIP</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center w-12">
                    <input type="checkbox" className="rounded border-neutral-300" />
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Source</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tags</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-neutral-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" className="rounded border-neutral-300" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{contact.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {contact.source === 'Instagram' ? (
                          <Instagram size={14} className="text-pink-500" />
                        ) : contact.source === 'Messenger' ? (
                          <Facebook size={14} className="text-blue-500" />
                        ) : (
                          <Mail size={14} className="text-neutral-400" />
                        )}
                        <span className="text-sm text-neutral-600">{contact.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        contact.status === 'Subscribed' ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                      )}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map(tag => (
                          <span key={tag} className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all">
                          <CheckCircle2 size={16} />
                        </button>
                        <button className="p-2 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContacts.length === 0 && (
              <div className="p-12 text-center">
                <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-neutral-300" size={24} />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">No contacts found</h3>
                <p className="text-neutral-500 text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
