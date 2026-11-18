'use client';

import {useState, type ComponentProps} from 'react';
import Form from 'react-bootstrap/Form';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';

type PasswordFieldProps = Omit<ComponentProps<typeof Form.Control>, 'type'> & {
  wrapperClassName?: string;
};

export default function PasswordField({wrapperClassName = '', ...controlProps}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-visibility-field ${wrapperClassName}`.trim()}>
      <Form.Control {...controlProps} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-visibility-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
      >
        <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} aria-hidden="true" />
      </button>
    </div>
  );
}
