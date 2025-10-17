import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import Badge from './ui/Badge';
import PrimaryButton from './ui/PrimaryButton';

const SitterCard = ({ id, name, grade, school, rate, rating, tags = [] }) => {
  const navigate = useNavigate();
  
  return (
  <Card className="p-5 hover:-translate-y-0.5">
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-semibold">
        {name?.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">{name}</h3>
          <span className="text-sm text-neutral-light">${rate}/hr</span>
        </div>
        <p className="text-sm text-neutral-light">Grade {grade} • {school}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm">⭐ {rating}</span>
          {tags.map((t) => (
            <Badge key={t} color="neutral">{t}</Badge>
          ))}
        </div>
      </div>
    </div>
    <div className="mt-4">
      <PrimaryButton 
        className="w-full" 
        onClick={() => navigate(`/student/${id}`)}
      >
        View Profile
      </PrimaryButton>
    </div>
  </Card>
  );
};

export default SitterCard;

