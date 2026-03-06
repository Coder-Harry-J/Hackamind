import { useState } from 'react';
import { Edit2, Check, X, Trash2, Image as ImageIcon, Save } from 'lucide-react';

export default function ListingTable({ data, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (item, field) => {
    setEditingId(item.id);
    setEditField(field);
    setEditValue(item[field] || '');
  };

  const saveEdit = (item) => {
    onUpdate(item.id, editField, editValue);
    setEditingId(null);
    setEditField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditField(null);
    setEditValue('');
  };

  const handleKeyDown = (e, item) => {
    if (e.key === 'Enter') {
      saveEdit(item);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const fields = [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Product title' },
    { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand name' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'Category' },
    { key: 'price', label: 'Price', type: 'number', placeholder: '0.00' },
  ];

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500">No products to display. Upload images to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Image
              </th>
              {fields.map((field) => (
                <th
                  key={field.key}
                  className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider"
                >
                  {field.label}
                </th>
              ))}
              <th className="text-right p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                {/* Image Column */}
                <td className="p-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Editable Fields */}
                {fields.map((field) => (
                  <td key={field.key} className="p-4">
                    {editingId === item.id && editField === field.key ? (
                      <div className="flex items-center gap-2">
                        <input
                          type={field.type}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, item)}
                          placeholder={field.placeholder}
                          className="
                            w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                          "
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(item)}
                          className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="
                          flex items-center gap-2 cursor-pointer group
                          ${!item[field.key] ? 'text-slate-400 italic' : 'text-slate-700'}
                        "
                        onClick={() => startEdit(item, field.key)}
                      >
                        <span className="text-sm">
                          {item[field.key] || <span className="text-slate-400">Click to add</span>}
                        </span>
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                ))}

                {/* Actions Column */}
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="
                        p-2 text-slate-400 hover:text-red-600 hover:bg-red-50
                        rounded-lg transition-all opacity-60 hover:opacity-100
                      "
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          Showing <strong>{data.length}</strong> product{data.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => {
            const csv = convertToCSV(data);
            downloadCSV(csv);
          }}
          className="
            px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50
            hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2
          "
        >
          <Save className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = ['title', 'brand', 'category', 'price', 'imageUrl'];
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// Helper function to download CSV
function downloadCSV(csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `catalog_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

