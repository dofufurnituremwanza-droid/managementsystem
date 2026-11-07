import React, { useState, useRef } from 'react';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImagePlus, X, Link, Upload, Plus, Star } from 'lucide-react';

export const ImageUploader = ({
  value,
  onChange,
  label = 'Product Images / Design Reference Photos'
}) => {
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  // Normalize value to an array of non-empty strings
  const images = Array.isArray(value)
    ? value.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : typeof value === 'string' && value.trim().length > 0
    ? [value.trim()]
    : [];

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setLoading(true);
      const compressedList = [];
      for (const file of files) {
        const compressed = await compressImageFile(file);
        if (compressed) {
          compressedList.push(compressed);
        }
      }

      const updated = [...images, ...compressedList];
      onChange(updated);
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      const updated = [...images, urlInput.trim()];
      onChange(updated);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = (indexToRemove, e) => {
    if (e) e.stopPropagation();
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary, e) => {
    if (e) e.stopPropagation();
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const filtered = images.filter((_, idx) => idx !== indexToPrimary);
    const updated = [selected, ...filtered];
    onChange(updated);
  };

  return (
    <div className="form-group form-full">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
        <label style={{ margin: 0, fontWeight: 600 }}>{label}</label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {images.length > 0 && (
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--gold-light)',
                background: 'rgba(197, 160, 89, 0.14)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600
              }}
            >
              {images.length} {images.length === 1 ? 'photo' : 'photos'} attached
            </span>
          )}

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
            <span>{showUrlInput ? 'Hide URL link' : 'Paste web image URL'}</span>
          </button>
        </div>
      </div>

      {/* Optional URL input toggle */}
      {showUrlInput && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="url"
            className="form-input"
            placeholder="Paste direct image URL (https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={handleApplyUrl}
          >
            Add Photo
          </button>
        </div>
      )}

      {/* Hidden File Input supporting multiple files */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* When images exist: show interactive gallery grid with "Add More" */}
      {images.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '12px',
              width: '100%'
            }}
          >
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: idx === 0 ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  background: '#090b0e',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                <img
                  src={imgUrl}
                  alt={`Attached Reference ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Cover badge on first image */}
                {idx === 0 ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(197, 160, 89, 0.95)',
                      color: '#0c0e12',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}
                  >
                    <Star size={10} fill="#0c0e12" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleSetPrimary(idx, e)}
                    title="Set as Main Cover Photo"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'var(--gold-light)',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Set Cover
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(idx, e)}
                  title="Remove this photo"
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.9)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {/* "+ Add More Photos" Tile */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                aspectRatio: '1',
                borderRadius: '10px',
                border: '2px dashed rgba(197, 160, 89, 0.4)',
                background: 'rgba(197, 160, 89, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: '6px',
                transition: 'all 0.2s ease',
                padding: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-primary)';
                e.currentTarget.style.background = 'rgba(197, 160, 89, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(197, 160, 89, 0.4)';
                e.currentTarget.style.background = 'rgba(197, 160, 89, 0.05)';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(197, 160, 89, 0.2)',
                  color: 'var(--gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Plus size={18} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold-light)', textAlign: 'center' }}>
                {loading ? 'Optimizing...' : '+ Add More'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Tap <strong>+ Add More</strong> to attach as many photos, angles or sketches as needed.</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <Upload size={12} /> Add Photos
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(197, 160, 89, 0.35)',
            borderRadius: '12px',
            padding: '24px 20px',
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
              width: '46px',
              height: '46px',
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
              {loading ? 'Optimizing photos...' : 'Click to Upload Reference Photos / Sketches'}
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
              Attach multiple images (camera capture, gallery, multiple files supported)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
