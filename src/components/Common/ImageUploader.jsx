import React, { useState, useRef } from 'react';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImagePlus, X, Link, Upload, Eye } from 'lucide-react';

export const ImageUploader = ({
  value,
  onChange,
  label = 'Product Image / Design Reference Photo'
}) => {
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const compressed = await compressImageFile(file);
      onChange(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="form-group form-full">
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gold-light)',
            fontSize: '0.74rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Link size={12} />
          <span>{showUrlInput ? 'Upload file instead' : 'Or paste image URL'}</span>
        </button>
      </label>

      {/* Optional URL input toggle */}
      {showUrlInput && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input
            type="url"
            className="form-input"
            placeholder="Paste image link (e.g. https://... or postimg link)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={handleApplyUrl}
          >
            Apply URL
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Upload Zone or Preview */}
      {value ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-gold-card)',
            background: '#090b0e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={value}
            alt="Product Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />

          {/* Action overlay */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'flex',
              gap: '6px'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
              onClick={() => fileInputRef.current?.click()}
              title="Replace image"
            >
              <Upload size={13} />
              <span>Change</span>
            </button>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.85)' }}
              onClick={handleRemove}
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(197, 160, 89, 0.35)',
            borderRadius: '12px',
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--gold-primary)';
            e.currentTarget.style.background = 'rgba(197, 160, 89, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(197, 160, 89, 0.35)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(197, 160, 89, 0.12)',
              color: 'var(--gold-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ImagePlus size={22} />
          </div>

          <div>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
              {loading ? 'Optimizing photo...' : 'Click to Upload Product Photo / Sketch'}
            </span>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Supports mobile camera capture, PNG, JPG, WebP from gallery or desktop
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
