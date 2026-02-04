// components/ContactCard.tsx
import React from 'react';
import CardFrame from '../util/CardFrame';
import UserInfoRow from '../util/UserInfoRow';
import { ContactCardProps } from '@/app/types/props';

const ContactCard: React.FC<ContactCardProps> = ({
  user_first_name,
  user_last_name,
  user_email,
  user_phone,
  showCheckbox = false
}) => {
  return (
    <CardFrame noMargin>
      <div className="flex items-center gap-2">
        {showCheckbox && <input type="checkbox" />}
        <div className="flex-1">
          <UserInfoRow
            firstName={user_first_name}
            lastName={user_last_name}
            phone={user_phone}
            email={user_email}
            size="lg"
          />
        </div>
      </div>
    </CardFrame>
  );
};

export default ContactCard;