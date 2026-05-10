import React, { useState, useRef, useMemo } from 'react';
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
  Plus,
  Edit2,
  Save,
  ChevronDown,
  Calendar,
  Undo2,
  Trash,
  Tag as TagIcon,
  Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const initialContacts = [
  { id: 1, name: 'Alex Johnson', email: 'alex@example.com', source: 'Instagram', status: 'Subscribed', lastActive: '2h ago', createdAt: new Date(Date.now() - 3600000 * 2), tags: ['Lead', 'High Intent'], folder: 'Inquiry' },
  { id: 2, name: 'Sarah Miller', email: 'sarah.m@gmail.com', source: 'Messenger', status: 'Subscribed', lastActive: '5h ago', createdAt: new Date(Date.now() - 3600000 * 5), tags: ['Customer'], folder: 'Customers' },
  { id: 3, name: 'James Wilson', email: 'jw@company.co', source: 'Direct', status: 'Unsubscribed', lastActive: '2 days ago', createdAt: new Date(Date.now() - 86400000 * 2), tags: ['Cold'], folder: 'Leads' },
  { id: 4, name: 'Emma Davis', email: 'emma@davis.io', source: 'Instagram', status: 'Subscribed', lastActive: '15m ago', createdAt: new Date(Date.now() - 600000 * 15), tags: ['VIP', 'Lead'], folder: 'Customers' },
  { id: 5, name: 'Michael Brown', email: 'mbrown@tech.net', source: 'Messenger', status: 'Subscribed', lastActive: '12h ago', createdAt: new Date(Date.now() - 3600000 * 12), tags: ['Inquiry'], folder: 'Leads' },
  { id: 6, name: 'Lisa Anderson', email: 'lisa.a@house.com', source: 'Instagram', status: 'Subscribed', lastActive: '1h ago', createdAt: new Date(Date.now() - 3600000), tags: ['Lead'], folder: 'Inquiry' },
  { id: 7, name: 'David Clark', email: 'clark@work.com', source: 'Direct', status: 'Subscribed', lastActive: '4h ago', createdAt: new Date(Date.now() - 3600000 * 4), tags: ['Follow-up'], folder: 'Follow-ups' },
];

export default function ContactList() {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>(Array.from(new Set(initialContacts.map(c => c.folder))));

  // Detailed Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All time');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(c => c.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [contacts]);

  const allSources = useMemo(() => {
    return Array.from(new Set(contacts.map(c => c.source)));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           contact.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFolder = selectedFolder ? contact.folder === selectedFolder : true;
      const matchesStatus = statusFilter === 'All' ? true : contact.status === statusFilter;
      const matchesSource = sourceFilter === 'All' ? true : contact.source === sourceFilter;
      const matchesTag = tagFilter === 'All' ? true : contact.tags.includes(tagFilter);
      
      // Date Filtering
      let matchesDate = true;
      const now = new Date();
      const contactDate = new Date(contact.createdAt);
      if (dateFilter === '24hrs') matchesDate = now.getTime() - contactDate.getTime() < 86400000;
      else if (dateFilter === '7 days') matchesDate = now.getTime() - contactDate.getTime() < 86400000 * 7;
      else if (dateFilter === '30 days') matchesDate = now.getTime() - contactDate.getTime() < 86400000 * 30;
      else if (dateFilter === '90 days') matchesDate = now.getTime() - contactDate.getTime() < 86400000 * 90;
      else if (dateFilter === '6 months') matchesDate = now.getTime() - contactDate.getTime() < 86400000 * 180;
      else if (dateFilter === '1 year') matchesDate = now.getTime() - contactDate.getTime() < 86400000 * 365;

      return matchesSearch && matchesFolder && matchesStatus && matchesSource && matchesTag && matchesDate;
    });
  }, [contacts, searchTerm, selectedFolder, statusFilter, sourceFilter, tagFilter, dateFilter]);

  const toggleStatus = (id: number) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, status: c.status === 'Subscribed' ? 'Unsubscribed' : 'Subscribed' } : c
    ));
  };

  const addTag = (id: number, tag: string) => {
    if (!tag) return;
    setContacts(contacts.map(c => 
      c.id === id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c
    ));
  };

  const removeTag = (id: number, tag: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, tags: c.tags.filter(t => t !== tag) } : c
    ));
  };

  const deleteContact = (id: number) => {
    setContacts(contacts.filter(c => c.id !== id));
    setDeleteConfirmId(null);
  };

  const createFolder = () => {
    if (folders.length >= 10) {
      alert("Maximum of 10 folders allowed.");
      return;
    }
    const name = prompt("Enter folder name (max 15 chars):");
    if (name) {
      if (name.length > 15) {
        alert("Folder name must be 15 characters or less.");
        return;
      }
      if (!folders.includes(name)) {
        setFolders([...folders, name]);
      }
    }
  };

  const renameFolder = (oldName: string) => {
    const newName = prompt(`Rename folder "${oldName}" to (max 15 chars):`, oldName);
    if (newName && newName !== oldName) {
      if (newName.length > 15) {
        alert("Folder name must be 15 characters or less.");
        return;
      }
      setFolders(folders.map(f => f === oldName ? newName : f));
      setContacts(contacts.map(c => c.folder === oldName ? { ...c, folder: newName } : c));
      if (selectedFolder === oldName) setSelectedFolder(newName);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Source', 'Status', 'Last Active', 'Tags', 'Folder', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(c => [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.source}"`,
        `"${c.status}"`,
        `"${c.lastActive}"`,
        `"${c.tags.join('|')}"`,
        `"${c.folder}"`,
        `"${new Date(c.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audience_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          createdAt: new Date(),
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
    <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth">
      <div className="p-4 sm:p-8 space-y-6 max-w-[1400px] mx-auto pb-32">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleBulkImport}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight text-left">Audience</h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1 font-medium text-left">Explore and manage your profile database.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          {/* Folder Filter Button for Mobile/Tablet */}
          <div className="relative lg:hidden flex-[2] min-w-0">
            <button 
              onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
              className={cn(
                "w-full flex items-center justify-between gap-2 rounded-xl border px-3 h-11 text-xs font-bold transition-all shadow-sm",
                selectedFolder ? "bg-blue-600 text-white border-blue-600 shadow-blue-100" : "bg-white border-neutral-200 text-neutral-600"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen size={18} className="shrink-0" />
                <span className="truncate">{selectedFolder || 'All Contacts'}</span>
              </div>
              <ChevronDown size={14} className={cn("transition-transform shrink-0", isFolderMenuOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isFolderMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setIsFolderMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-neutral-200 shadow-2xl z-[110] p-2 shadow-blue-100/50"
                  >
                    <button 
                      onClick={() => { setSelectedFolder(null); setIsFolderMenuOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all mb-1 flex items-center gap-2",
                        selectedFolder === null ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-50"
                      )}
                    >
                      <FolderOpen size={14} />
                      All Contacts
                    </button>
                    {folders.map(f => (
                      <div key={f} className="flex items-center group">
                        <button 
                          onClick={() => { setSelectedFolder(f); setIsFolderMenuOpen(false); }}
                          className={cn(
                            "flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 truncate",
                            selectedFolder === f ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-50"
                          )}
                        >
                          <FolderOpen size={14} />
                          {f}
                        </button>
                        <button onClick={() => renameFolder(f)} className="p-2 text-neutral-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="my-2 h-[1px] bg-neutral-100" />
                    <button 
                      onClick={() => { createFolder(); setIsFolderMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <Plus size={14} />
                      New Folder
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 sm:px-4 h-11 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm min-w-[44px] sm:min-w-[100px]"
            title="Export CSV"
          >
            <Download size={16} className="shrink-0" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 sm:px-4 h-11 text-xs font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all min-w-[44px] sm:min-w-[100px]"
            title="Import CSV"
          >
            <UserPlus size={16} className="shrink-0" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Folders Navigation - Laptop Only */}
        <div className="hidden lg:block w-56 shrink-0 space-y-6">
          <div className="flex flex-col items-start gap-1 pb-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 px-2">Folders</h3>
            <button 
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                selectedFolder === null ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border border-neutral-100 text-neutral-500 hover:bg-neutral-50"
              )}
            >
              <FolderOpen size={16} />
              All Contacts
            </button>
            {folders.map(folder => (
              <div key={folder} className="w-full flex items-center group relative">
                <button 
                  onClick={() => setSelectedFolder(folder)}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                    selectedFolder === folder ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border border-neutral-100 text-neutral-500 hover:bg-neutral-50"
                  )}
                >
                  <FolderOpen size={16} />
                  <span className="truncate pr-6">{folder}</span>
                </button>
                <button 
                  onClick={() => renameFolder(folder)}
                  className={cn(
                    "absolute right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
                    selectedFolder === folder ? "text-blue-200 hover:text-white" : "text-neutral-400 hover:text-blue-600"
                  )}
                >
                  <Edit2 size={12} />
                </button>
              </div>
            ))}
            <button 
              onClick={createFolder}
              className="w-full mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Plus size={16} />
              New Folder
            </button>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white p-2 sm:p-3 rounded-2xl border border-neutral-200 shadow-sm relative z-30">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..."
                className="w-full rounded-xl border-none bg-neutral-50 py-2 sm:py-2.5 pl-9 pr-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border h-10 sm:h-11 px-3 sm:px-5 text-xs sm:text-sm font-black transition-all shadow-sm shrink-0",
                  isFilterOpen ? "border-blue-200 bg-blue-50 text-blue-600" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                )}
                title="Filters"
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button 
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds([]);
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border h-10 sm:h-11 px-3 sm:px-5 text-xs sm:text-sm font-black transition-all shadow-sm shrink-0",
                  isSelectionMode ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                )}
                title="Select"
              >
                <CheckCircle2 size={18} />
                <span className="hidden sm:inline">{isSelectionMode ? "Cancel" : "Select"}</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isSelectionMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-xl border border-blue-100 mb-2 relative z-20"
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
                    <button 
                      onClick={() => { if(window.confirm(`Delete ${selectedIds.length} contacts?`)) setContacts(contacts.filter(c => !selectedIds.includes(c.id))); }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Selected"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-lg transition-all" title="Export Selected"
                    >
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
                className="overflow-hidden relative z-10"
              >
                <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-inner grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={10} />
                      Status
                    </label>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option>All</option>
                      <option>Subscribed</option>
                      <option>Unsubscribed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Globe size={10} />
                      Source
                    </label>
                    <select 
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option>All</option>
                      {allSources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TagIcon size={10} />
                      Tag
                    </label>
                    <select 
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option>All</option>
                      {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={10} />
                      Date Range
                    </label>
                    <select 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option>All time</option>
                      <option value="24hrs">Last 24 Hours</option>
                      <option value="7 days">Last 7 Days</option>
                      <option value="30 days">Last 30 Days</option>
                      <option value="90 days">Last 90 Days</option>
                      <option value="6 months">Last 6 Months</option>
                      <option value="1 year">Last 1 Year</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[320px] sm:min-w-[800px]">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200">
                  <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-400">Contact</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-400">Status</th>
                  <th className="px-4 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-400">Tags</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-400 text-right">Actions</th>
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
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn(
                          "h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-lg transition-all relative overflow-hidden",
                          selectedIds.includes(contact.id) 
                            ? "bg-blue-600 shadow-blue-200" 
                            : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-100"
                        )}>
                          {isSelectionMode && selectedIds.includes(contact.id) ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : (
                            contact.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-sm font-black text-neutral-900 truncate">{contact.name}</p>
                          <p className="hidden sm:block text-[11px] text-neutral-400 font-bold mt-0.5 truncate">{contact.email}</p>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="sm:hidden text-[7px] font-black uppercase tracking-widest px-1 rounded border bg-blue-50 text-blue-600 border-blue-100">
                                {contact.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center sm:text-left">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(contact.id); }}
                        className={cn(
                          "inline-flex rounded-lg px-2 sm:px-2.5 py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                          contact.status === 'Subscribed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-neutral-50 text-neutral-400 border border-neutral-100"
                        )}
                      >
                        {contact.status}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 items-center min-w-[60px]">
                        {contact.tags.slice(0, 1).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[7px] sm:text-[9px] px-1 sm:px-2 py-0.5 rounded-md uppercase font-black tracking-wider border border-neutral-200 group/tag truncate max-w-[50px] sm:max-w-none">
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 1 && (
                            <span className="text-[7px] font-bold text-neutral-400">+{contact.tags.length - 1}</span>
                        )}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const t = prompt("Enter tag:");
                            if(t) addTag(contact.id, t);
                          }}
                          className="p-1 rounded-md border border-dashed border-neutral-200 text-neutral-400 hover:text-blue-500 hover:border-blue-200 transition-all shrink-0 sm:block hidden"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 relative">
                        {deleteConfirmId === contact.id ? (
                          <div className="flex items-center gap-1 bg-white border border-red-100 rounded-xl p-1 shadow-lg shadow-red-50 animate-in fade-in slide-in-from-right-2 duration-200 z-50">
                            <button 
                              onClick={() => deleteContact(contact.id)}
                              className="px-2 sm:px-3 py-1.5 rounded-lg bg-red-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                            >
                              <Trash size={12} />
                              Delete
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-1 rounded-lg text-neutral-400 hover:bg-neutral-50 font-bold text-[9px] sm:text-[10px] uppercase"
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => toggleStatus(contact.id)}
                              className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:bg-white hover:text-blue-600 hover:shadow-sm hover:border hover:border-neutral-200 transition-all"
                              title="Toggle Status"
                            >
                              <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(contact.id)}
                              className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
                              title="Delete Contact"
                            >
                              <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </>
                        )}
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
                <h3 className="text-lg font-bold text-neutral-900 line-clamp-1">No contacts found</h3>
                <p className="text-neutral-500 text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
