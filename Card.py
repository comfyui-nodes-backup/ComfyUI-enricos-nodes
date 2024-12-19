class Card:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required":
                {
                    "card": ("CARD", {"forceInput": True}),
                },
            }
    
    RETURN_TYPES = ("string","string")  # Returning a list of dictionaries
    RETURN_NAMEs = ("id","desc")  # Returning a list of dictionaries
    FUNCTION = "process_json"

    def process_json(self, **kwargs):

        
        try:
            
            
            card = kwargs.pop('card', None)
            
            print("-----------------")
            print(card)
            

            
            
            
            return (card["id"],card["desc"])  
        except Exception as e:
            return ([{"error": str(e)}],)