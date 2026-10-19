/* eslint-disable react/prop-types */
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './SearchInput.scss';

const SearchInput = ({
  value,
  placeholder,
  onChange,
  className = '',
  ariaLabel,
  type = 'text',
}) => (
  <div className={['search-input', className].filter(Boolean).join(' ')}>
    <FontAwesomeIcon icon={faSearch} className="search-input__icon" aria-hidden />
    <input
      type={type}
      className="search-input__field"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      aria-label={ariaLabel || placeholder}
    />
  </div>
);

export default SearchInput;
