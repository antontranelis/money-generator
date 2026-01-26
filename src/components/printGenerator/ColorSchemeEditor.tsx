/**
 * Color Scheme Editor Modal
 *
 * Allows users to edit built-in color schemes or create custom ones.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ColorScheme, CustomColorScheme } from '../../types/printGenerator';

interface ColorSchemeEditorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close the modal */
  onClose: () => void;
  /** The scheme being edited (null for new custom scheme) */
  editingScheme: {
    key: string;
    name: string;
    colors: string[];
    isBuiltIn: boolean;
    context: 'spiritual' | 'business' | 'both';
  } | null;
  /** Callback when saving a built-in override */
  onSaveBuiltInOverride: (key: ColorScheme, colors: string[]) => void;
  /** Callback when resetting a built-in override */
  onResetBuiltInOverride: (key: ColorScheme) => void;
  /** Callback when saving a custom scheme */
  onSaveCustomScheme: (scheme: Omit<CustomColorScheme, 'id' | 'isBuiltIn'>) => void;
  /** Callback when updating a custom scheme */
  onUpdateCustomScheme: (id: string, updates: Partial<Omit<CustomColorScheme, 'id' | 'isBuiltIn'>>) => void;
  /** Callback when deleting a custom scheme */
  onDeleteCustomScheme: (id: string) => void;
  /** Original colors for built-in scheme (for reset) */
  originalColors?: string[];
  /** Whether this is an override of a built-in */
  hasOverride?: boolean;
  /** Language for labels */
  language: 'de' | 'en';
}

const labels = {
  de: {
    titleEdit: 'Farbschema bearbeiten',
    titleNew: 'Neues Farbschema erstellen',
    name: 'Name',
    colors: 'Farben',
    preview: 'Vorschau',
    addColor: 'Farbe hinzufügen',
    removeColor: 'Entfernen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    reset: 'Zurücksetzen',
    delete: 'Löschen',
    minColors: 'Mindestens 3 Farben erforderlich',
    maxColors: 'Maximal 6 Farben möglich',
    confirmDelete: 'Dieses Farbschema wirklich löschen?',
  },
  en: {
    titleEdit: 'Edit Color Scheme',
    titleNew: 'Create New Color Scheme',
    name: 'Name',
    colors: 'Colors',
    preview: 'Preview',
    addColor: 'Add Color',
    removeColor: 'Remove',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    delete: 'Delete',
    minColors: 'At least 3 colors required',
    maxColors: 'Maximum 6 colors allowed',
    confirmDelete: 'Really delete this color scheme?',
  },
};

export function ColorSchemeEditor({
  isOpen,
  onClose,
  editingScheme,
  onSaveBuiltInOverride,
  onResetBuiltInOverride,
  onSaveCustomScheme,
  onUpdateCustomScheme,
  onDeleteCustomScheme,
  originalColors,
  hasOverride,
  language,
}: ColorSchemeEditorProps) {
  const t = labels[language];

  const [name, setName] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize state when scheme changes
  useEffect(() => {
    if (editingScheme) {
      setName(editingScheme.name);
      setColors([...editingScheme.colors]);
    } else {
      // New custom scheme - default values
      setName('');
      setColors(['#D4AF37', '#8B9A46', '#6B8E23', '#F7E7CE']);
    }
    setShowDeleteConfirm(false);
  }, [editingScheme, isOpen]);

  const handleColorChange = useCallback((index: number, value: string) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddColor = useCallback(() => {
    if (colors.length < 6) {
      setColors((prev) => [...prev, '#888888']);
    }
  }, [colors.length]);

  const handleRemoveColor = useCallback((index: number) => {
    if (colors.length > 3) {
      setColors((prev) => prev.filter((_, i) => i !== index));
    }
  }, [colors.length]);

  const handleSave = useCallback(() => {
    if (!editingScheme || !editingScheme.key) {
      // New custom scheme (either from scratch or from "from-logo")
      onSaveCustomScheme({
        name: name.trim() || 'Custom',
        colors,
        context: editingScheme?.context || 'both',
      });
    } else if (editingScheme.isBuiltIn) {
      // Built-in override
      onSaveBuiltInOverride(editingScheme.key as ColorScheme, colors);
    } else {
      // Update existing custom scheme
      onUpdateCustomScheme(editingScheme.key, {
        name: name.trim() || 'Custom',
        colors,
      });
    }
    onClose();
  }, [editingScheme, name, colors, onSaveCustomScheme, onSaveBuiltInOverride, onUpdateCustomScheme, onClose]);

  const handleReset = useCallback(() => {
    if (editingScheme?.isBuiltIn && originalColors) {
      onResetBuiltInOverride(editingScheme.key as ColorScheme);
      onClose();
    }
  }, [editingScheme, originalColors, onResetBuiltInOverride, onClose]);

  const handleDelete = useCallback(() => {
    if (editingScheme && !editingScheme.isBuiltIn) {
      onDeleteCustomScheme(editingScheme.key);
      onClose();
    }
  }, [editingScheme, onDeleteCustomScheme, onClose]);

  if (!isOpen) return null;

  const isNewScheme = !editingScheme || !editingScheme.key;
  const isBuiltIn = editingScheme?.isBuiltIn ?? false;
  const canDelete = !isNewScheme && !isBuiltIn && !!editingScheme?.key;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">
            {isNewScheme ? t.titleNew : t.titleEdit}
          </h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Name Input (only for custom schemes) */}
        {!isBuiltIn && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">{t.name}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Custom Color Scheme"
            />
          </div>
        )}

        {/* Color Pickers */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text font-medium">{t.colors}</span>
            <span className="label-text-alt opacity-60">{colors.length}/6</span>
          </label>
          <div className="space-y-2">
            {colors.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded cursor-pointer border border-base-300"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 font-mono text-sm"
                  value={color.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      handleColorChange(index, val);
                    }
                  }}
                  maxLength={7}
                />
                {colors.length > 3 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-circle text-error"
                    onClick={() => handleRemoveColor(index)}
                    title={t.removeColor}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {colors.length < 6 && (
            <button
              type="button"
              className="btn btn-sm btn-ghost mt-2 gap-1"
              onClick={handleAddColor}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {t.addColor}
            </button>
          )}
          {colors.length === 3 && (
            <p className="text-xs text-warning mt-1">{t.minColors}</p>
          )}
        </div>

        {/* Preview */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">{t.preview}</span>
          </label>
          <div className="flex gap-1 p-3 bg-base-200 rounded-lg">
            {colors.map((color, index) => (
              <div
                key={index}
                className="flex-1 h-12 rounded-md shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && canDelete && (
          <div className="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">{t.confirmDelete}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-error"
                onClick={handleDelete}
              >
                {t.delete}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-action">
          {/* Reset button for built-in schemes with override */}
          {isBuiltIn && hasOverride && (
            <button
              type="button"
              className="btn btn-ghost text-warning"
              onClick={handleReset}
            >
              {t.reset}
            </button>
          )}

          {/* Delete button for custom schemes */}
          {canDelete && !showDeleteConfirm && (
            <button
              type="button"
              className="btn btn-ghost text-error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t.delete}
            </button>
          )}

          <div className="flex-1" />

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={colors.length < 3}
          >
            {t.save}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
