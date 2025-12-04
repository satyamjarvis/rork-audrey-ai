import { useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  website?: string;
  birthday?: string;
  notes?: string;
  listIds: string[];
  isFavorite: boolean;
  createdAt: string;
};

export type ContactList = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

const CONTACTS_KEY = "@phonebook_contacts";
const LISTS_KEY = "@phonebook_lists";

const defaultColors = [
  "#667EEA",
  "#4FACFE",
  "#FA709A",
  "#F093FB",
  "#30CFD0",
  "#FFB84D",
  "#A18CD1",
];

export const [PhonebookProvider, usePhonebook] = createContextHook(() => {
  const {
    data: contacts,
    isLoading: contactsLoading,
    saveData: saveContacts,
    error: contactsError,
  } = usePersistentStorage<Contact[]>({
    key: CONTACTS_KEY,
    initialValue: [],
    encryption: true,
    backup: true,
    debounce: 1000,
  });

  const {
    data: lists,
    isLoading: listsLoading,
    saveData: saveLists,
    error: listsError,
  } = usePersistentStorage<ContactList[]>({
    key: LISTS_KEY,
    initialValue: [],
    encryption: true,
    backup: true,
    debounce: 1000,
  });

  const isLoading = contactsLoading || listsLoading;

  const addContact = useCallback(
    async (contact: Omit<Contact, "id" | "createdAt">) => {
      const newContact: Contact = {
        ...contact,
        id: `contact_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      await saveContacts((prev) => [...prev, newContact]);
      console.log("🔒 Contact added and encrypted:", newContact.id);
      return newContact;
    },
    [saveContacts]
  );

  const updateContact = useCallback(
    async (contactId: string, updates: Partial<Contact>) => {
      await saveContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, ...updates } : contact
        )
      );
      console.log("🔒 Contact updated and encrypted:", contactId);
    },
    [saveContacts]
  );

  const deleteContact = useCallback(
    async (contactId: string) => {
      await saveContacts((prev) => prev.filter((contact) => contact.id !== contactId));
      console.log("🔒 Contact deleted:", contactId);
    },
    [saveContacts]
  );

  const createList = useCallback(
    async (name: string) => {
      const newList: ContactList = {
        id: `list_${Date.now()}`,
        name,
        color: defaultColors[lists.length % defaultColors.length],
      };
      await saveLists((prev) => [...prev, newList]);
      console.log("🔒 List created and encrypted:", newList.id);
      return newList;
    },
    [lists.length, saveLists]
  );

  const updateList = useCallback(
    async (listId: string, updates: Partial<ContactList>) => {
      await saveLists((prev) =>
        prev.map((list) =>
          list.id === listId ? { ...list, ...updates } : list
        )
      );
      console.log("🔒 List updated and encrypted:", listId);
    },
    [saveLists]
  );

  const deleteList = useCallback(
    async (listId: string) => {
      await saveLists((prev) => prev.filter((list) => list.id !== listId));
      await saveContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          listIds: contact.listIds.filter((id) => id !== listId),
        }))
      );
      console.log("🔒 List deleted:", listId);
    },
    [saveLists, saveContacts]
  );

  const addContactToList = useCallback(
    async (contactId: string, listId: string) => {
      await saveContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? { ...contact, listIds: [...contact.listIds, listId] }
            : contact
        )
      );
      console.log(`🔒 Contact ${contactId} added to list ${listId}`);
    },
    [saveContacts]
  );

  const removeContactFromList = useCallback(
    async (contactId: string, listId: string) => {
      await saveContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? { ...contact, listIds: contact.listIds.filter((id) => id !== listId) }
            : contact
        )
      );
      console.log(`🔒 Contact ${contactId} removed from list ${listId}`);
    },
    [saveContacts]
  );

  const toggleFavorite = useCallback(
    async (contactId: string) => {
      await saveContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? { ...contact, isFavorite: !contact.isFavorite }
            : contact
        )
      );
      console.log(`🔒 Contact ${contactId} favorite toggled`);
    },
    [saveContacts]
  );

  const getContactsByList = useCallback(
    (listId: string) => {
      return contacts.filter((contact) => contact.listIds.includes(listId));
    },
    [contacts]
  );

  const getFavoriteContacts = useCallback(() => {
    return contacts.filter((contact) => contact.isFavorite);
  }, [contacts]);

  return useMemo(
    () => ({
      contacts,
      lists,
      isLoading,
      addContact,
      updateContact,
      deleteContact,
      createList,
      updateList,
      deleteList,
      addContactToList,
      removeContactFromList,
      toggleFavorite,
      getContactsByList,
      getFavoriteContacts,
    }),
    [
      contacts,
      lists,
      isLoading,
      addContact,
      updateContact,
      deleteContact,
      createList,
      updateList,
      deleteList,
      addContactToList,
      removeContactFromList,
      toggleFavorite,
      getContactsByList,
      getFavoriteContacts,
    ]
  );
});
