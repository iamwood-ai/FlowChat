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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = Array.from(new Set(contacts.map(c => c.folder)));

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder ? contact.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
    <div className="p-4 sm:p-8 space-y-6 max-w-[1400px] mx-auto">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleBulkImport}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Audience</h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1 font-medium">Manage all your contacts and lead data in one place.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
          >
            <Download size={16} />
            Export
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
          >
            <UserPlus size={16} />
            Import
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Folders Navigation - Improved for all screens */}
        <div className="w-full lg:w-56 shrink-0 space-y-2 lg:space-y-6">
          <div className="flex lg:flex-col items-center lg:items-start gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <h3 className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 px-2 italic">Folders</h3>
            <button 
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0",
                selectedFolder === null ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border border-neutral-100 text-neutral-500 hover:bg-neutral-50"
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
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0",
                  selectedFolder === folder ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border border-neutral-100 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <FolderOpen size={16} />
                {folder}
              </button>
            ))}
            <button className="lg:mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-blue-600 hover:bg-blue-50 transition-all whitespace-nowrap">
              <Plus size={16} />
              New Folder
            </button>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text" 
                placeholder="Search name, email, or tag..."
                className="w-full rounded-xl border-none bg-neutral-50 py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs sm:text-sm font-black transition-all shadow-sm",
                isFilterOpen ? "border-blue-200 bg-blue-50 text-blue-600" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Filter size={18} />
              Filters
            </button>
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds([]);
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs sm:text-sm font-black transition-all shadow-sm",
                isSelectionMode ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <CheckCircle2 size={18} />
              {isSelectionMode ? "Cancel Select" : "Select"}
            </button>
          </div>

          <AnimatePresence>
            {isSelectionMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-xl border border-blue-100 mb-2"
              >
                <button 
                  onClick={toggleSelectAll}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  {selectedIds.length === filteredContacts.length ? (
                    <>
                      <X size={14} />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Select All
                    </>
                  )}
                </button>
                {selectedIds.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedIds.length} Selected</span>
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Selected">
                      <Trash2 size={16} />
                    </button>
                    <button className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-lg transition-all" title="Export Selected">
                      <Download size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-neutral-400">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-neutral-400 hidden sm:table-cell">Source</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-neutral-400">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-neutral-400 hidden md:table-cell">Tags</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-neutral-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    onClick={() => isSelectionMode && toggleSelectOne(contact.id)}
                    className={cn(
                      "hover:bg-neutral-50/50 transition-colors group",
                      !isSelectionMode ? "cursor-default" : "cursor-pointer",
                      selectedIds.includes(contact.id) && "bg-blue-50/30"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg transition-all relative overflow-hidden",
                          selectedIds.includes(contact.id) 
                            ? "bg-blue-600 shadow-blue-200" 
                            : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-100"
                        )}>
                          {isSelectionMode && selectedIds.includes(contact.id) ? (
                            <CheckCircle2 size={18} className="text-white" />
                          ) : (
                            contact.name.split(' ').map(n => n[0]).join('')
                          )}
                          {isSelectionMode && !selectedIds.includes(contact.id) && (
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="h-4 w-4 border-2 border-white rounded-sm" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-neutral-900">{contact.name}</p>
                          <p className="text-[11px] text-neutral-400 font-bold mt-0.5">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {contact.source === 'Instagram' ? (
                          <div className="bg-pink-50 text-pink-500 p-1.5 rounded-lg border border-pink-100">
                            <Instagram size={14} />
                          </div>
                        ) : contact.source === 'Messenger' ? (
                          <div className="bg-blue-50 text-blue-500 p-1.5 rounded-lg border border-blue-100">
                            <Facebook size={14} />
                          </div>
                        ) : (
                          <div className="bg-neutral-50 text-neutral-400 p-1.5 rounded-lg border border-neutral-100">
                            <Mail size={14} />
                          </div>
                        )}
                        <span className="text-xs font-bold text-neutral-600">{contact.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                        contact.status === 'Subscribed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-neutral-50 text-neutral-400 border border-neutral-100"
                      )}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map(tag => (
                          <span key={tag} className="bg-neutral-100 text-neutral-500 text-[9px] px-2 py-0.5 rounded-md uppercase font-black tracking-wider border border-neutral-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 rounded-xl text-neutral-400 hover:bg-white hover:text-blue-600 hover:shadow-sm hover:border hover:border-neutral-200 transition-all">
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="p-2 rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all">
                          <Trash2 size={18} />
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
