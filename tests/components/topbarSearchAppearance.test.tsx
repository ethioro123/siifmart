// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DesktopSearch } from '../../components/topbar/DesktopSearch';
import { MobileSearch } from '../../components/topbar/MobileSearch';

describe('Global Search Bar Appearance & Alignment', () => {
  afterEach(cleanup);
  it('renders DesktopSearch with clean Search... placeholder and rounded-xl styling', () => {
    const setSearchValue = vi.fn();
    const setIsSearchOpen = vi.fn();
    const handleSearch = vi.fn();
    const handleResultClick = vi.fn();
    const containerRef = { current: null };

    const { container } = render(
      <DesktopSearch
        searchValue=""
        setSearchValue={setSearchValue}
        isSearchOpen={false}
        setIsSearchOpen={setIsSearchOpen}
        searchResults={{ total: 0 }}
        handleSearch={handleSearch}
        handleResultClick={handleResultClick}
        containerRef={containerRef}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeDefined();

    // Check that form has rounded-xl (Apple design token) and NOT rounded-full (alien pill)
    const form = container.querySelector('form');
    expect(form?.className).toContain('rounded-xl');
    expect(form?.className).not.toContain('rounded-full');

    // Check that there is no blue circular wrapper around the search icon
    const blueCircle = container.querySelector('.bg-blue-500\\/10');
    expect(blueCircle).toBeNull();

    // Keycap badge for Cmd+K is present
    expect(screen.getByText('⌘')).toBeDefined();
    expect(screen.getByText('K')).toBeDefined();
  });

  it('renders clear button when searchValue is entered in DesktopSearch', () => {
    const setSearchValue = vi.fn();
    const setIsSearchOpen = vi.fn();

    render(
      <DesktopSearch
        searchValue="cooking oil"
        setSearchValue={setSearchValue}
        isSearchOpen={true}
        setIsSearchOpen={setIsSearchOpen}
        searchResults={{ total: 0 }}
        handleSearch={vi.fn()}
        handleResultClick={vi.fn()}
        containerRef={{ current: null }}
      />
    );

    const clearBtn = screen.getByLabelText('Clear Search');
    expect(clearBtn).toBeDefined();
    fireEvent.click(clearBtn);

    expect(setSearchValue).toHaveBeenCalledWith('');
    expect(setIsSearchOpen).toHaveBeenCalledWith(false);
  });

  it('renders MobileSearch with clean Search... placeholder and rounded-xl container', () => {
    const setSearchValue = vi.fn();
    const setIsMobileSearchVisible = vi.fn();

    const { container } = render(
      <MobileSearch
        isMobileSearchVisible={true}
        setIsMobileSearchVisible={setIsMobileSearchVisible}
        searchValue=""
        setSearchValue={setSearchValue}
        searchResults={{ total: 0 }}
        handleResultClick={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeDefined();

    // Check rounded-xl and no blue square inside the search input container
    const searchContainer = input.parentElement;
    expect(searchContainer?.className).toContain('rounded-xl');
    expect(searchContainer?.className).not.toContain('rounded-2xl');
    expect(searchContainer?.querySelector('.bg-blue-500\\/10')).toBeNull();
  });
});
