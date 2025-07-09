"use client";
import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HoverPrefetchLink } from "./HoverPrefetchLink";

type User = {
  id: number;
  clerkUserId: string;
  name: string;
};

type GroupedUsers = {
  [letter: string]: User[];
};

interface UserListClientProps {
  initialData: GroupedUsers;
}

const UserListClient: React.FC<UserListClientProps> = ({ initialData }) => {
  const alphabet = useMemo(() => Object.keys(initialData).sort(), [initialData]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isInitialLoad = useRef(true);

  const currentSection = searchParams?.get('section') || (alphabet.length > 0 ? alphabet[0] : '');

  const updateURLSection = useCallback((section: string) => {
    if (isInitialLoad.current) return;
    
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
    newSearchParams.set('section', section);
    const newURL = `${pathname}?${newSearchParams.toString()}`;
    router.replace(newURL, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (alphabet.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (isInitialLoad.current) return;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const letter = entry.target.id.replace('group-', '');
          updateURLSection(letter);
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      if (!isInitialLoad.current) {
        alphabet.forEach((letter) => {
          const element = document.getElementById(`group-${letter}`);
          if (element && observerRef.current) {
            observerRef.current.observe(element);
          }
        });
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [alphabet, updateURLSection]);

  useEffect(() => {
    if (!isInitialLoad.current) return;
    
    const targetSection = searchParams?.get('section') || alphabet[0];
    
    if (targetSection && alphabet.includes(targetSection)) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`group-${targetSection}`);
        if (element) {
          const navbarHeight = 80;
          const stickyNavHeight = 40;
          const yOffset = -(navbarHeight + stickyNavHeight + 10);
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        
        setTimeout(() => {
          isInitialLoad.current = false;
          
          if (observerRef.current) {
            alphabet.forEach((letter) => {
              const element = document.getElementById(`group-${letter}`);
              if (element && observerRef.current) {
                observerRef.current.observe(element);
              }
            });
          }
        }, 300);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      isInitialLoad.current = false;
    }
  }, [alphabet, searchParams]);

  const handleLetterClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, letter: string) => {
    e.preventDefault();
    isInitialLoad.current = false;
    const element = document.getElementById(`group-${letter}`);
    if (element) {
      const navbarHeight = 80;
      const stickyNavHeight = 40;
      const yOffset = -(navbarHeight + stickyNavHeight + 10);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      updateURLSection(letter);
    }
  }, [updateURLSection]);

  const AlphabetNav = useMemo(() => (
    <div className="hidden sm:block sticky top-20 z-30 bg-gray-900/98 backdrop-blur-sm -mx-2 px-2 shadow-lg">
      <div className="container mx-auto py-1.5 px-2 sm:px-4">
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-0.5 sm:gap-1 max-w-none 
          sm:overflow-x-auto
          [&::-webkit-scrollbar]:h-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-600/50
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {alphabet.map((letter) => (
            <a
              key={letter}
              href={`#group-${letter}`}
              className={`${
                currentSection === letter 
                  ? "text-white bg-indigo-500/40 border-indigo-400/70" 
                  : "text-gray-400 hover:text-white bg-gray-800/60 hover:bg-indigo-500/25 border-gray-700/30 hover:border-indigo-500/50"
              } px-1 sm:px-1.5 md:px-2 py-0.5 rounded transition-all duration-200 font-medium 
                text-[10px] sm:text-xs min-w-[20px] sm:min-w-[24px] md:min-w-[28px] 
                text-center shadow-sm hover:shadow-indigo-500/10 active:scale-95 
                whitespace-nowrap flex-shrink-0 border`}
              onClick={(e) => handleLetterClick(e, letter)}
            >
              {letter}
            </a>
          ))}
        </div>
      </div>
    </div>
  ), [alphabet, handleLetterClick, currentSection]);

  if (alphabet.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">No users available</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {AlphabetNav}

      <div className="px-2 mt-4 sm:mt-6">
        {alphabet.map((letter) => {
          const users = initialData[letter];
          return (
            <UserGroup key={letter} letter={letter} users={users} />
          );
        })}
      </div>
    </div>
  );
};

const UserGroup = React.memo(({ letter, users }: { letter: string; users: User[] }) => {
  return (
    <div
      id={`group-${letter}`}
      className="mb-6"
    >
      <h3 className="font-semibold text-lg text-white mb-3">
        {letter}
      </h3>
      <div className="space-y-1">
        {users.map((user) => (
          <UserItem key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
});

UserGroup.displayName = 'UserGroup';

const UserItem = React.memo(({ user }: { user: User }) => {
  return (
    <HoverPrefetchLink 
      href={`user/${user.name}/characters`}
      className="block text-indigo-400 hover:text-indigo-300 hover:bg-gray-800/30 cursor-pointer py-2 px-3 rounded-md transition-all duration-200 text-sm"
      prefetchDelay={150}
    >
      {user.name}
    </HoverPrefetchLink>
  );
});

UserItem.displayName = 'UserItem';

export default UserListClient; 