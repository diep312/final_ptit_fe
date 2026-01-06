import { Calendar, MapPin, Users, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface ConferenceCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  attendees: number;
  image: string;
  description?: string;
  isEnlarged?: boolean;
  tags?: string[];
}

export const ConferenceCard = ({
  id,
  title,
  category,
  date,
  location,
  attendees,
  image,
  description,
  tags,
  isEnlarged = false,
}: ConferenceCardProps) => {
  const safeTags = Array.isArray(tags) ? tags : [];

  return (
    <Link to={`/conference/${id}/dashboard`}>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`relative bg-card rounded-xl overflow-hidden flex items-center transition-all duration-300 ${
          isEnlarged ? "p-4 h-80" : "p-2 h-40"
        }`}
      >
        {/* More Options Button */}
        <div className="absolute top-3 right-3">
          <MoreVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </div>

        {/* Left Thumbnail */}
        <motion.div
          layout
          className="relative flex-shrink-0 rounded-lg overflow-hidden h-full aspect-square"
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Right Info */}
        <div className="flex flex-col justify-between p-4 w-full overflow-hidden">
          <div>
            {/* Title animation */}
            <motion.h3
              layout
              animate={{
                fontSize: isEnlarged ? "1.5rem" : "1.125rem", // 24px vs 18px
                opacity: isEnlarged ? 1 : 0.9,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="font-sans font-semibold text-foreground mb-2"
            >
              {title}
            </motion.h3>

            <div className="flex gap-2 items-center pb-3">
              <span className="bg-primary text-primary-foreground text-md font-medium px-3 py-1 rounded-full">
                {category}
              </span>
            </div>

            {isEnlarged && description && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-muted-foreground mb-3 max-h-24 overflow-y-auto"
              >
                {description}
              </motion.p>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-icon" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{attendees.toLocaleString()} người tham dự</span>
            </div>
          </div>

          {safeTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3">
              {safeTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};
