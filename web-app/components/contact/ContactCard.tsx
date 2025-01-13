// components/ContactCard.tsx
import React from 'react';
import CardFrame from '../util/CardFrame';
import { formatPhoneNumber } from '../../app/utils';
import { ContactCardProps } from '../../app/types/props';

const ContactCard: React.FC<ContactCardProps> = ({ 
  user_first_name,
  user_last_name, 
  user_email, 
  user_phone, 
  showCheckbox = false 
}) => {
  const fullName = `${user_first_name} ${user_last_name}`;
  const formattedPhone = formatPhoneNumber(user_phone);

  return (
    <CardFrame noMargin>
      <div className="grid grid-cols-3 items-center">
        {showCheckbox && <input type="checkbox" className="mr-4" />}
        <span className="text-lg">{fullName}</span>
        <span className="text-lg text-center">{formattedPhone}</span>
        <span className="text-lg text-right">{user_email}</span>
      </div>
    </CardFrame>
  );
};

export default ContactCard;