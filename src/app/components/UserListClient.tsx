"use client";
import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HoverPrefetchLink } from "./HoverPrefetchLink";
import SupporterBadge, { supporterRowClass, supporterNameStyle } from "./SupporterBadge";

type User = {
  id: number;
  clerkUserId: string;
  name: string;
  supporterTier: number;
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
          const searchAreaHeight = 140;
          const yOffset = -(navbarHeight + stickyNavHeight + searchAreaHeight + 10);
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
      const searchAreaHeight = 140;
      const yOffset = -(navbarHeight + stickyNavHeight + searchAreaHeight + 10);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      updateURLSection(letter);
    }
  }, [updateURLSection]);

  const AlphabetNav = useMemo(() => (
    <div className="hidden sm:block sticky top-20 z-30 bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto py-1.5 px-2 sm:px-4">
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-0.5 sm:gap-0 max-w-none
          sm:overflow-x-auto
          [&::-webkit-scrollbar]:h-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-700
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {alphabet.map((letter) => (
            <a
              key={letter}
              href={`#group-${letter}`}
              className={`${
                currentSection === letter 
                  ? "text-indigo-400 bg-indigo-500/10" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
              } px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-md transition-colors duration-150 font-medium 
                text-[11px] sm:text-xs min-w-[22px] sm:min-w-[26px] md:min-w-[30px] 
                text-center whitespace-nowrap flex-shrink-0`}
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
        <div className="text-gray-500">No users available</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {AlphabetNav}

      <div className="px-2 sm:px-4 mt-4 sm:mt-6 max-w-3xl mx-auto">
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
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {letter}
        </h3>
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-[11px] text-gray-600 tabular-nums">{users.length}</span>
      </div>
      <div className="divide-y divide-gray-800/50">
        {users.map((user) => (
          <UserItem key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
});

UserGroup.displayName = 'UserGroup';

const UserItem = React.memo(({ user }: { user: User }) => {
  const rowBg = supporterRowClass(user.supporterTier);
  return (
    <HoverPrefetchLink 
      href={`user/${user.name}/characters`}
      className={`flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-800/40 cursor-pointer py-1.5 px-3 transition-colors duration-150 text-sm relative overflow-hidden ${rowBg}`}
      prefetchDelay={150}
    >
      <span style={supporterNameStyle(user.supporterTier)}>{user.name}</span>
      {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} />}
    </HoverPrefetchLink>
  );
});

UserItem.displayName = 'UserItem';

export default UserListClient;