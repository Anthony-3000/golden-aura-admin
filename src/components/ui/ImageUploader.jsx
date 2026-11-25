import { useRef, useState } from 'react';
import { colors, fonts, radii } from '../../lib/theme.js';
import { uploadImage } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Icon from '../Icon.jsx';
import Spinner from './Spinner.jsx';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Product/category image manager. Every managed image is uploaded and verified through R2.
 */
export default function ImageUploader({
  images = [],
  onChange,
  purpose = 'product',
  max = 10,
  single = false,
  helper = 'JPEG, PNG, WebP or AVIF · up to 8 MB each.',
}) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const limit = single ? 1 : max;
  const canAdd = images.length < limit;

  const update = (next) => onChange?.(next.map((image, index) => ({ ...image, displayOrder: index + 1 })));

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setError('');

    const remaining = limit - images.length;
    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added.`);
    }

    setUploading(true);
    let next = [...images];
    for (const file of selected) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`${file.name}: unsupported file type. Use JPEG, PNG, WebP or AVIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 8 MB.`);
        continue;
      }
      try {
        const image = await uploadImage(file, purpose);
        next = [...next, { ...image, altText: image.altText || file.name.replace(/\.[^.]+$/, '') }];
        update(next);
        toast.success(`${file.name} uploaded.`);
      } catch (uploadError) {
        setError(uploadError.message);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const remove = (index) => update(images.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {images.map((image, index) => (
          <div
            key={image.objectKey || image.publicUrl || index}
            style={{
              width: 150,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              background: colors.surface,
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', height: 118, background: colors.cream }}>
              <img
                src={image.publicUrl}
                alt={image.altText || 'Uploaded image'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3 }}>
                {!single ? (
                  <>
                    <MiniButton icon="chevronUp" label="Move earlier" onClick={() => move(index, -1)} disabled={index === 0} />
                    <MiniButton
                      icon="chevronDown"
                      label="Move later"
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                    />
                  </>
                ) : null}
                <MiniButton icon="close" label="Remove image" onClick={() => remove(index)} danger />
              </div>
              {index === 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    bottom: 6,
                    background: 'rgba(28,21,16,.78)',
                    color: '#FBF3E6',
                    fontSize: 8.5,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    padding: '3px 6px',
                    borderRadius: 4,
                  }}
                >
                  Primary
                </span>
              ) : null}
            </div>
            <input
              value={image.altText || ''}
              onChange={(event) =>
                update(images.map((item, itemIndex) => (itemIndex === index ? { ...item, altText: event.target.value } : item)))
              }
              placeholder="Alt text"
              aria-label={`Alt text for image ${index + 1}`}
              style={{
                width: '100%',
                border: 0,
                borderTop: `1px solid ${colors.border}`,
                padding: '7px 9px',
                fontSize: 10.5,
                fontFamily: fonts.body,
                color: colors.inkSoft,
                outline: 'none',
                background: colors.surface,
              }}
            />
          </div>
        ))}

        {canAdd ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              width: 150,
              height: 145,
              borderRadius: radii.md,
              border: `1px dashed ${colors.borderStrong}`,
              background: '#FCF9F3',
              color: colors.muted,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              fontSize: 11,
              fontFamily: fonts.body,
              cursor: uploading ? 'progress' : 'pointer',
            }}
          >
            {uploading ? (
              <>
                <Spinner size={20} />
                Uploading…
              </>
            ) : (
              <>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: colors.champagne,
                    color: colors.goldDeep,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="upload" size={16} />
                </span>
                Add image
              </>
            )}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple={!single}
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: colors.faint, lineHeight: 1.5 }}>{helper}</span>
      </div>

      {error ? (
        <div style={{ fontSize: 11.5, color: colors.danger, lineHeight: 1.55 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

function MiniButton({ icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 23,
        height: 23,
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,.4)',
        background: 'rgba(28,21,16,.72)',
        color: danger ? '#F3B9A8' : '#FBF3E6',
        display: 'grid',
        placeItems: 'center',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Icon name={icon} size={11} />
    </button>
  );
}
